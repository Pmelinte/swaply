-- =============================================
-- Distance-Based Search Implementation
-- =============================================
-- This migration adds GPS location support to objects
-- and creates a Haversine distance calculation function
-- for proximity-based search.
--
-- Created: 2024
-- Purpose: Enable location-based object search

-- =============================================
-- 1. ADD LOCATION COLUMNS TO OBJECTS TABLE
-- =============================================

ALTER TABLE objects
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Add index for efficient geospatial queries
CREATE INDEX IF NOT EXISTS idx_objects_location ON objects(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments
COMMENT ON COLUMN objects.latitude IS 'GPS latitude coordinate (-90 to 90)';
COMMENT ON COLUMN objects.longitude IS 'GPS longitude coordinate (-180 to 180)';
COMMENT ON COLUMN objects.location_name IS 'Human-readable location name (city, address)';

-- =============================================
-- 2. HAVERSINE DISTANCE FUNCTION
-- =============================================
-- Calculates distance between two GPS coordinates in kilometers
-- Uses Haversine formula: https://en.wikipedia.org/wiki/Haversine_formula

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  earth_radius NUMERIC := 6371; -- Earth radius in kilometers
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  -- Return NULL if any coordinate is NULL
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;

  -- Convert degrees to radians
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);

  -- Haversine formula
  a := SIN(dlat / 2) ^ 2 + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon / 2) ^ 2;
  c := 2 * ASIN(SQRT(a));

  -- Return distance in kilometers (rounded to 2 decimal places)
  RETURN ROUND((earth_radius * c)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment
COMMENT ON FUNCTION calculate_distance IS 'Calculate distance between two GPS coordinates using Haversine formula (returns kilometers)';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION calculate_distance(NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated;

-- =============================================
-- 3. SEARCH OBJECTS BY DISTANCE FUNCTION
-- =============================================
-- Returns objects within specified radius of given location

CREATE OR REPLACE FUNCTION search_objects_by_distance(
  user_lat NUMERIC,
  user_lon NUMERIC,
  radius_km NUMERIC DEFAULT 25,
  search_query TEXT DEFAULT NULL,
  object_category TEXT DEFAULT NULL,
  max_results INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  status TEXT,
  images JSONB,
  user_id UUID,
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  location_name TEXT,
  distance_km NUMERIC,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.title,
    o.description,
    o.category,
    o.status,
    o.images,
    o.user_id,
    o.location,
    o.latitude,
    o.longitude,
    o.location_name,
    calculate_distance(user_lat, user_lon, o.latitude, o.longitude) as distance_km,
    o.created_at
  FROM objects o
  WHERE o.status = 'available'
    AND o.latitude IS NOT NULL
    AND o.longitude IS NOT NULL
    AND calculate_distance(user_lat, user_lon, o.latitude, o.longitude) <= radius_km
    AND (search_query IS NULL OR o.title ILIKE '%' || search_query || '%' OR o.description ILIKE '%' || search_query || '%')
    AND (object_category IS NULL OR o.category = object_category)
  ORDER BY distance_km ASC, o.created_at DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment
COMMENT ON FUNCTION search_objects_by_distance IS 'Search objects within radius of user location, sorted by distance';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION search_objects_by_distance(NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, INT) TO authenticated;

-- =============================================
-- 4. GET NEARBY USERS FUNCTION
-- =============================================
-- Returns users with objects near given location (for recommendations)

CREATE OR REPLACE FUNCTION get_nearby_users(
  user_lat NUMERIC,
  user_lon NUMERIC,
  radius_km NUMERIC DEFAULT 50,
  max_results INT DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  object_count BIGINT,
  avg_distance_km NUMERIC,
  closest_object_distance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.user_id,
    u.email,
    u.full_name,
    COUNT(DISTINCT o.id) as object_count,
    ROUND(AVG(calculate_distance(user_lat, user_lon, o.latitude, o.longitude))::NUMERIC, 2) as avg_distance_km,
    ROUND(MIN(calculate_distance(user_lat, user_lon, o.latitude, o.longitude))::NUMERIC, 2) as closest_object_distance
  FROM objects o
  JOIN users u ON o.user_id = u.id
  WHERE o.status = 'available'
    AND o.latitude IS NOT NULL
    AND o.longitude IS NOT NULL
    AND calculate_distance(user_lat, user_lon, o.latitude, o.longitude) <= radius_km
  GROUP BY o.user_id, u.email, u.full_name
  ORDER BY avg_distance_km ASC, object_count DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment
COMMENT ON FUNCTION get_nearby_users IS 'Get users with objects near location, useful for recommendations';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_nearby_users(NUMERIC, NUMERIC, NUMERIC, INT) TO authenticated;

-- =============================================
-- 5. VALIDATION CONSTRAINTS
-- =============================================

-- Add check constraints for valid GPS coordinates
ALTER TABLE objects
ADD CONSTRAINT check_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE objects
ADD CONSTRAINT check_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- =============================================
-- 6. SAMPLE DATA UPDATE (OPTIONAL)
-- =============================================
-- Uncomment to add sample GPS coordinates to existing objects

/*
-- Major Romanian cities coordinates
UPDATE objects SET
  latitude = 44.4268,
  longitude = 26.1025,
  location_name = 'București'
WHERE location ILIKE '%bucuresti%' OR location ILIKE '%bucharest%';

UPDATE objects SET
  latitude = 45.9432,
  longitude = 24.9668,
  location_name = 'Brașov'
WHERE location ILIKE '%brasov%';

UPDATE objects SET
  latitude = 46.7712,
  longitude = 23.6236,
  location_name = 'Cluj-Napoca'
WHERE location ILIKE '%cluj%';

UPDATE objects SET
  latitude = 47.1585,
  longitude = 27.6014,
  location_name = 'Iași'
WHERE location ILIKE '%iasi%';

UPDATE objects SET
  latitude = 45.7489,
  longitude = 21.2087,
  location_name = 'Timișoara'
WHERE location ILIKE '%timisoara%';

UPDATE objects SET
  latitude = 44.1598,
  longitude = 28.6348,
  location_name = 'Constanța'
WHERE location ILIKE '%constanta%';

UPDATE objects SET
  latitude = 44.3182,
  longitude = 23.8014,
  location_name = 'Craiova'
WHERE location ILIKE '%craiova%';
*/

-- =============================================
-- 7. EXAMPLE USAGE
-- =============================================

-- Search objects within 25km of Bucharest center:
-- SELECT * FROM search_objects_by_distance(44.4268, 26.1025, 25);

-- Search objects within 50km with keyword filter:
-- SELECT * FROM search_objects_by_distance(44.4268, 26.1025, 50, 'laptop');

-- Search objects within 10km in specific category:
-- SELECT * FROM search_objects_by_distance(44.4268, 26.1025, 10, NULL, 'Electronice');

-- Get nearby users within 100km:
-- SELECT * FROM get_nearby_users(44.4268, 26.1025, 100);

-- Calculate distance between two points:
-- SELECT calculate_distance(44.4268, 26.1025, 45.9432, 24.9668); -- Bucharest to Brașov (~139 km)
