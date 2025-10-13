'use client';

/**
 * Cold Start Wizard Component
 * 5-question onboarding for new users to bootstrap personalization
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Search, 
  DollarSign, 
  MapPin, 
  Calendar,
  ChevronRight,
  Check,
  X
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { submitOnboarding, skipOnboarding } from '@/lib/personalization';
import type { OnboardingResponses } from '@/lib/personalization';

interface ColdStartWizardProps {
  userId: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

const STEPS = 5;

export default function ColdStartWizard({ 
  userId, 
  onComplete, 
  onSkip 
}: ColdStartWizardProps) {
  const { t } = useI18n();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [responses, setResponses] = useState<Partial<OnboardingResponses>>({
    user_id: userId,
    interested_categories: [],
    max_distance_km: 50,
  });

  // ============================================================================
  // STEP 1: Purpose
  // ============================================================================
  const purposeOptions = [
    {
      value: 'declutter' as const,
      icon: Sparkles,
      title: t('onboarding.purpose.declutter.title'),
      description: t('onboarding.purpose.declutter.desc'),
    },
    {
      value: 'find_items' as const,
      icon: Search,
      title: t('onboarding.purpose.find.title'),
      description: t('onboarding.purpose.find.desc'),
    },
    {
      value: 'save_money' as const,
      icon: DollarSign,
      title: t('onboarding.purpose.save.title'),
      description: t('onboarding.purpose.save.desc'),
    },
    {
      value: 'eco_friendly' as const,
      icon: '🌱',
      title: t('onboarding.purpose.eco.title'),
      description: t('onboarding.purpose.eco.desc'),
    },
    {
      value: 'community' as const,
      icon: '👥',
      title: t('onboarding.purpose.community.title'),
      description: t('onboarding.purpose.community.desc'),
    },
  ];

  // ============================================================================
  // STEP 2: Categories (simplified - top 10 only)
  // ============================================================================
  const categoryOptions = [
    { id: 'electronics', name: t('categories.electronics'), icon: '💻' },
    { id: 'home-garden', name: t('categories.home'), icon: '🏡' },
    { id: 'fashion', name: t('categories.fashion'), icon: '👕' },
    { id: 'sports', name: t('categories.sports'), icon: '⚽' },
    { id: 'vehicles', name: t('categories.vehicles'), icon: '🚗' },
    { id: 'books-media', name: t('categories.books'), icon: '📚' },
    { id: 'toys-kids', name: t('categories.toys'), icon: '🧸' },
    { id: 'tools', name: t('categories.tools'), icon: '🔧' },
    { id: 'services', name: t('categories.services'), icon: '🛠️' },
    { id: 'housing', name: t('categories.housing'), icon: '🏠' },
  ];

  // ============================================================================
  // STEP 3: Value Range
  // ============================================================================
  const valueRangeOptions = [
    { min: 0, max: 50, label: t('onboarding.value.low') },
    { min: 50, max: 200, label: t('onboarding.value.medium') },
    { min: 200, max: 500, label: t('onboarding.value.high') },
    { min: 500, max: null, label: t('onboarding.value.premium') },
  ];

  // ============================================================================
  // STEP 4: Distance
  // ============================================================================
  const distanceOptions = [
    { km: 10, label: t('onboarding.distance.very_local') },
    { km: 25, label: t('onboarding.distance.local') },
    { km: 50, label: t('onboarding.distance.nearby') },
    { km: 100, label: t('onboarding.distance.regional') },
    { km: 500, label: t('onboarding.distance.national') },
  ];

  // ============================================================================
  // STEP 5: Frequency
  // ============================================================================
  const frequencyOptions = [
    { value: 'daily' as const, label: t('onboarding.frequency.daily'), icon: '🔥' },
    { value: 'weekly' as const, label: t('onboarding.frequency.weekly'), icon: '📅' },
    { value: 'monthly' as const, label: t('onboarding.frequency.monthly'), icon: '📆' },
    { value: 'occasionally' as const, label: t('onboarding.frequency.occasionally'), icon: '⏰' },
  ];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleNext = () => {
    if (currentStep < STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await skipOnboarding(userId);
    if (onSkip) {
      onSkip();
    } else {
      router.push('/');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await submitOnboarding(responses as OnboardingResponses);
      
      if (onComplete) {
        onComplete();
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      alert(t('onboarding.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!responses.purpose;
      case 2:
        return (responses.interested_categories?.length || 0) > 0;
      case 3:
        return responses.value_range_min !== undefined;
      case 4:
        return !!responses.max_distance_km;
      case 5:
        return !!responses.swap_frequency;
      default:
        return false;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('onboarding.welcome')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('onboarding.subtitle')}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('onboarding.step')} {currentStep} {t('common.of')} {STEPS}
            </span>
            <span className="text-sm text-blue-500 font-semibold">
              {Math.round((currentStep / STEPS) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(currentStep / STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="mb-8">
          {/* Step 1: Purpose */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('onboarding.q1.title')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {purposeOptions.map((option) => {
                  const Icon = typeof option.icon === 'string' ? null : option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setResponses({ ...responses, purpose: option.value })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        responses.purpose === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {Icon ? <Icon className="w-6 h-6" /> : option.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {option.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {option.description}
                          </div>
                        </div>
                        {responses.purpose === option.value && (
                          <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Categories */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('onboarding.q2.title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('onboarding.q2.subtitle')}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categoryOptions.map((category) => {
                  const isSelected = responses.interested_categories?.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        const current = responses.interested_categories || [];
                        setResponses({
                          ...responses,
                          interested_categories: isSelected
                            ? current.filter(id => id !== category.id)
                            : [...current, category.id]
                        });
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{category.icon}</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-500 mx-auto mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Value Range */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('onboarding.q3.title')}
              </h2>
              <div className="space-y-3">
                {valueRangeOptions.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => setResponses({
                      ...responses,
                      value_range_min: range.min,
                      value_range_max: range.max || 999999
                    })}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      responses.value_range_min === range.min
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {range.label}
                      </span>
                      {responses.value_range_min === range.min && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Distance */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('onboarding.q4.title')}
              </h2>
              <div className="space-y-3">
                {distanceOptions.map((option) => (
                  <button
                    key={option.km}
                    onClick={() => setResponses({ ...responses, max_distance_km: option.km })}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      responses.max_distance_km === option.km
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {option.label}
                        </span>
                      </div>
                      {responses.max_distance_km === option.km && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Frequency */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('onboarding.q5.title')}
              </h2>
              <div className="space-y-3">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setResponses({ ...responses, swap_frequency: option.value })}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      responses.swap_frequency === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {option.label}
                          </div>
                        </div>
                      </div>
                      {responses.swap_frequency === option.value && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            {t('onboarding.skip')}
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('common.back')}
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                canProceed() && !isSubmitting
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                t('common.saving')
              ) : currentStep === STEPS ? (
                t('onboarding.finish')
              ) : (
                <>
                  {t('common.next')}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
