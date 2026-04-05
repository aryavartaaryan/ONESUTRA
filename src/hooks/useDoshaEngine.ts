'use client';
/**
 * useDoshaEngine — React hook layer over the doshaService + doshaStore
 * Provides computed, reactive Ayurvedic intelligence to any component.
 */

import { useMemo, useEffect, useState } from 'react';
import { useDoshaStore } from '@/stores/doshaStore';
import {
  getCurrentDoshaPhase,
  getCurrentSeason,
  getDoshaRecommendations,
  generateDoshaStory,
  estimateAyurvedicMetrics,
  isBrahmaMuhurta,
  calculatePrakriti,
  calculateVikriti,
  aggregateQuizScores,
  DOSHA_INFO,
  type DoshaKala,
  type RitucharayaSeason,
  type DoshaRecommendation,
  type AyurvedicMetrics,
  type Prakriti,
  type Vikriti,
  type QuizAnswer,
} from '@/lib/doshaService';
import type { PraktitiAssessment, VikritiiAssessment } from '@/stores/doshaStore';

export function useDoshaEngine() {
  const store = useDoshaStore();

  const [currentPhase, setCurrentPhase] = useState<DoshaKala>(() => getCurrentDoshaPhase());
  const [inBrahmaMuhurta, setInBrahmaMuhurta] = useState(() => isBrahmaMuhurta());

  // Update Dosha Kala every minute
  useEffect(() => {
    const update = () => {
      setCurrentPhase(getCurrentDoshaPhase());
      setInBrahmaMuhurta(isBrahmaMuhurta());
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  const prakriti = useMemo<Prakriti | null>(() => {
    return store.prakritiAssessment?.prakriti ?? null;
  }, [store.prakritiAssessment]);

  const vikriti = useMemo<Vikriti | null>(() => {
    return store.vikritiiAssessment?.vikriti ?? null;
  }, [store.vikritiiAssessment]);

  const currentSeason = useMemo<RitucharayaSeason>(() => getCurrentSeason(), []);

  const recommendations = useMemo<DoshaRecommendation | null>(() => {
    if (!prakriti) return null;
    return getDoshaRecommendations(prakriti, vikriti ?? undefined);
  }, [prakriti, vikriti]);

  const doshaStory = useMemo<string[] | null>(() => {
    if (!prakriti || !vikriti) return null;
    return generateDoshaStory(prakriti, vikriti);
  }, [prakriti, vikriti]);

  const doshaInfo = useMemo(() => {
    if (!prakriti) return null;
    return DOSHA_INFO[prakriti.primary];
  }, [prakriti]);

  const rollingBalance = useMemo(() => {
    return store.getRollingDoshaBalance(7);
  }, [store]);

  const todayLog = useMemo(() => store.getTodayLog(), [store]);

  const metrics = useMemo<AyurvedicMetrics | null>(() => {
    if (!todayLog) return null;
    return estimateAyurvedicMetrics({
      habitCompletionRate: 60,
      sleepQuality: todayLog.sleepQuality === 'deep' ? 90 : todayLog.sleepQuality === 'medium' ? 60 : 30,
      mealTiming: todayLog.mealTiming ?? 60,
      tongueCoating: todayLog.tongueCoating ?? 'slight',
      energyLevel: ((todayLog.energyLevel ?? 3) / 5) * 100,
    });
  }, [todayLog]);

  const completePrakritiQuiz = (answers: QuizAnswer[]) => {
    const scores = aggregateQuizScores(answers);
    const prakritiResult = calculatePrakriti(scores);
    const answerMap: Record<string, string> = {};
    answers.forEach(a => { answerMap[a.questionId] = a.answerId; });

    const assessment: PraktitiAssessment = {
      completedAt: Date.now(),
      answers: answerMap,
      scores,
      prakriti: prakritiResult,
    };
    store.setPrakritiAssessment(assessment);
    return prakritiResult;
  };

  const completeVikritiiQuiz = (answers: QuizAnswer[]) => {
    const scores = aggregateQuizScores(answers);
    const vikritiiResult = calculateVikriti(scores);
    const answerMap: Record<string, string> = {};
    answers.forEach(a => { answerMap[a.questionId] = a.answerId; });

    const assessment: VikritiiAssessment = {
      completedAt: Date.now(),
      answers: answerMap,
      scores,
      vikriti: vikritiiResult,
    };
    store.setVikritiiAssessment(assessment);
    return vikritiiResult;
  };

  return {
    // State
    prakriti,
    vikriti,
    currentPhase,
    currentSeason,
    inBrahmaMuhurta,
    recommendations,
    doshaStory,
    doshaInfo,
    rollingBalance,
    todayLog,
    metrics,
    doshaOnboardingComplete: store.doshaOnboardingComplete,
    prakritiAssessment: store.prakritiAssessment,
    vikritiiAssessment: store.vikritiiAssessment,
    lifestyleSnapshot: store.lifestyleSnapshot,

    // Actions
    completePrakritiQuiz,
    completeVikritiiQuiz,
    logDailyDosha: store.logDailyDosha,
    updateDailyLog: store.updateDailyLog,
    setLifestyleSnapshot: store.setLifestyleSnapshot,
    resetDoshaOnboarding: store.resetDoshaOnboarding,
    getRecentLogs: store.getRecentLogs,
  };
}
