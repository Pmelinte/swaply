-- Date de bază pentru aplicația Swaply

-- Inserează categoriile principale
INSERT INTO public.categories (name, slug, description, icon, sort_order) VALUES
('Electronice', 'electronice', 'Telefoane, laptopuri, gadget-uri și alte electronice', '💻', 1),
('Gaming', 'gaming', 'Console, jocuri, accesorii gaming', '🎮', 2),
('Cărți', 'carti', 'Cărți, reviste, materiale educaționale', '📚', 3),
('Casă și Grădină', 'casa-gradina', 'Mobilier, decorațiuni, unelte, plante', '🏠', 4),
('Sport și Fitness', 'sport-fitness', 'Echipament sportiv, haine sport, accesorii fitness', '⚽', 5),
('Modă și Accesorii', 'moda-accesorii', 'Haine, pantofi, genți, bijuterii', '👗', 6),
('Muzică și Instrumente', 'muzica-instrumente', 'Instrumente muzicale, echipament audio', '🎵', 7),
('Artă și Hobby', 'arta-hobby', 'Materiale de artă, hobby-uri, colecții', '🎨', 8),
('Vehicule și Accesorii', 'vehicule-accesorii', 'Biciclete, piese auto, accesorii transport', '🚗', 9),
('Diverse', 'diverse', 'Alte categorii și obiecte generale', '📦', 10);

-- Subcategorii pentru Electronice
INSERT INTO public.categories (name, slug, description, icon, parent_id, sort_order) 
SELECT 'Telefoane Mobile', 'telefoane-mobile', 'Smartphone-uri și telefoane', '📱', id, 1 
FROM public.categories WHERE slug = 'electronice';

INSERT INTO public.categories (name, slug, description, icon, parent_id, sort_order) 
SELECT 'Laptopuri și PC', 'laptopuri-pc', 'Computere portabile și desktop', '💻', id, 2 
FROM public.categories WHERE slug = 'electronice';

INSERT INTO public.categories (name, slug, description, icon, parent_id, sort_order) 
SELECT 'Audio/Video', 'audio-video', 'Căști, boxe, camere, TV', '🎧', id, 3 
FROM public.categories WHERE slug = 'electronice';

INSERT INTO public.categories (name, slug, description, icon, parent_id, sort_order) 
SELECT 'Accesorii Tech', 'accesorii-tech', 'Huse, încărcătoare, cabluri', '🔌', id, 4 
FROM public.categories WHERE slug = 'electronice';

-- Subcategorii pentru Gaming
INSERT INTO public.categories (name, slug, description, icon, parent_id, sort_order) 
SELECT 'Console', 'console', 'PlayStation, Xbox, Nintendo', '🎮', id, 1 
FROM public.categories WHERE slug = 'gaming';

INSERT INTO public.categories (name, slug, description, icon, parent_id, sort_order) 
SELECT 'Jocuri PC', 'jocuri-pc', 'Jocuri pentru computer', '🖥️', id, 2 
FROM public.categories WHERE slug = 'gaming';

INSERT INTO public.categories (name, slug, description, icon, parent_id, sort_order) 
SELECT 'Accesorii Gaming', 'accesorii-gaming', 'Controllere, headset-uri, mouse-uri gaming', '🕹️', id, 3 
FROM public.categories WHERE slug = 'gaming';

-- Subcategorii pentru Cărți
INSERT INTO public.categories (name, slug, description, icon, parent_id, sort_order) 
SELECT 'Ficțiune', 'fictiune', 'Romane, povestiri, fantasy, SF', '📖', id, 1 
FROM public.categories WHERE slug = 'carti';

INSERT INTO public.categories (name, slug, description, icon, parent_id, sort_order) 
SELECT 'Non-ficțiune', 'non-fictiune', 'Biografie, istorie, știință', '📘', id, 2 
FROM public.categories WHERE slug = 'carti';

INSERT INTO public.categories (name, slug, description, icon, parent_id, sort_order) 
SELECT 'Educaționale', 'educationale', 'Manuale, cursuri, materiale didactice', '📚', id, 3 
FROM public.categories WHERE slug = 'carti';

-- Date sample pentru testare (opțional)
-- Acestea vor fi adăugate după ce se creează utilizatori prin aplicație

-- Setări globale pentru aplicație
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now()
);

INSERT INTO public.app_settings (key, value, description) VALUES
('matching_algorithm_weights', '{"category": 0.4, "location": 0.3, "value": 0.2, "condition": 0.1}', 'Ponderile algoritmului de matching'),
('max_images_per_object', '6', 'Numărul maxim de imagini per obiect'),
('default_search_radius_km', '50', 'Raza de căutare implicită în km'),
('swap_request_expiry_days', '7', 'Numărul de zile după care o cerere de swap expiră'),
('notification_settings', '{"push_enabled": true, "email_enabled": true, "sms_enabled": false}', 'Setări notificări'),
('app_version', '"1.0.0"', 'Versiunea aplicației'),
('maintenance_mode', 'false', 'Modul mentenanță activat/dezactivat');

-- Trigger pentru updated_at pe app_settings
CREATE TRIGGER update_app_settings_updated_at 
  BEFORE UPDATE ON public.app_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();