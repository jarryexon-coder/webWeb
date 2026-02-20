// Custom hook for building custom parlays
import { useState, useCallback, useMemo } from 'react';
import { ParlayLeg } from '../types/predictions.types';
import { 
  calculateParlayOdds, 
  calculateImpliedProbability,
  validateCorrelation,
  calculateCorrelationFactor 
} from '../utils/oddsCalculators';
import { saveParlayTemplate, getParlayTemplates } from '../utils/parlayStorage';

interface ParlayBuilderOptions {
  maxLegs?: number;
  allowCorrelated?: boolean;
  autoSave?: boolean;
}

export const useParlayBuilder = (options: ParlayBuilderOptions = {}) => {
  const {
    maxLegs = 10,
    allowCorrelated = false,
    autoSave = false
  } = options;

  const [selectedLegs, setSelectedLegs] = useState<ParlayLeg[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Validate leg addition
  const validateLegAddition = useCallback((leg: ParlayLeg): boolean => {
    // Check maximum legs
    if (selectedLegs.length >= maxLegs) {
      setValidationError(`Maximum ${maxLegs} legs allowed per parlay`);
      return false;
    }

    // Check for duplicate events
    const isDuplicate = selectedLegs.some(
      existing => existing.eventId === leg.eventId && 
      existing.marketId === leg.marketId
    );
    if (isDuplicate) {
      setValidationError('This selection is already in your parlay');
      return false;
    }

    // Check correlation if not allowed
    if (!allowCorrelated && selectedLegs.length > 0) {
      const isCorrelated = selectedLegs.some(
        existing => validateCorrelation(existing, leg)
      );
      if (isCorrelated) {
        setValidationError('Correlated bets are not allowed in this parlay');
        return false;
      }
    }

    setValidationError(null);
    return true;
  }, [selectedLegs, maxLegs, allowCorrelated]);

  const addLeg = useCallback((leg: ParlayLeg) => {
    if (!validateLegAddition(leg)) return false;
    
    setSelectedLegs(prev => [...prev, leg]);
    setValidationError(null);
    return true;
  }, [validateLegAddition]);

  const removeLeg = useCallback((index: number) => {
    setSelectedLegs(prev => prev.filter((_, i) => i !== index));
    setValidationError(null);
  }, []);

  const updateLeg = useCallback((index: number, updatedLeg: ParlayLeg) => {
    setSelectedLegs(prev => {
      const newLegs = [...prev];
      newLegs[index] = updatedLeg;
      return newLegs;
    });
  }, []);

  const clearLegs = useCallback(() => {
    setSelectedLegs([]);
    setValidationError(null);
  }, []);

  // Calculate correlation metrics
  const correlationMetrics = useMemo(() => {
    if (selectedLegs.length < 2) return null;
    
    return {
      factor: calculateCorrelationFactor(selectedLegs),
      correlatedPairs: selectedLegs.filter((leg, i) => 
        selectedLegs.some((other, j) => 
          j > i && validateCorrelation(leg, other)
        )
      ).length / 2
    };
  }, [selectedLegs]);

  // Calculate combined odds
  const combinedOdds = useMemo(() => {
    if (selectedLegs.length === 0) return 'N/A';
    return calculateParlayOdds(selectedLegs);
  }, [selectedLegs]);

  // Calculate implied probability
  const impliedProbability = useMemo(() => {
    if (selectedLegs.length === 0) return 0;
    return selectedLegs.reduce(
      (acc, leg) => acc * calculateImpliedProbability(leg.odds), 
      1
    );
  }, [selectedLegs]);

  // Calculate potential payout
  const potentialPayout = useMemo(() => {
    if (combinedOdds === 'N/A') return 0;
    const oddsNum = parseFloat(combinedOdds);
    return isNaN(oddsNum) ? 0 : oddsNum;
  }, [combinedOdds]);

  // Save as template
  const saveTemplate = useCallback(async (name: string) => {
    if (selectedLegs.length === 0) {
      throw new Error('Cannot save empty parlay');
    }

    setIsSaving(true);
    try {
      const template = {
        id: crypto.randomUUID(),
        name,
        legs: selectedLegs,
        combinedOdds,
        createdAt: new Date().toISOString(),
        legCount: selectedLegs.length
      };
      
      await saveParlayTemplate(template);
      return template.id;
    } finally {
      setIsSaving(false);
    }
  }, [selectedLegs, combinedOdds]);

  // Load template
  const loadTemplate = useCallback(async (templateId: string) => {
    const templates = await getParlayTemplates();
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedLegs(template.legs);
      setValidationError(null);
    }
    return template;
  }, []);

  // Auto-save effect
  useMemo(() => {
    if (autoSave && selectedLegs.length > 0) {
      saveTemplate(`Auto-save ${new Date().toLocaleString()}`)
        .catch(console.error);
    }
  }, [selectedLegs, autoSave, saveTemplate]);

  return {
    // State
    selectedLegs,
    validationError,
    isSaving,
    
    // Leg management
    addLeg,
    removeLeg,
    updateLeg,
    clearLegs,
    
    // Calculations
    combinedOdds,
    impliedProbability,
    potentialPayout,
    correlationMetrics,
    
    // Metadata
    legCount: selectedLegs.length,
    maxLegs,
    
    // Templates
    saveTemplate,
    loadTemplate,
    
    // Validation
    isValid: selectedLegs.length > 0 && !validationError,
    canAddMore: selectedLegs.length < maxLegs
  };
};
