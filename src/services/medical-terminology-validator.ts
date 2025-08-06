export interface ValidationResult {
  isValid: boolean;
  filteredContent: string;
  warnings: string[];
  errors?: string[];
}

export interface FilterResult {
  filtered: string;
  warnings: string[];
}

export class MedicalTerminologyValidator {
  private prohibitedTerms = {
    medications: [
      'aspirin', 'ibuprofen', 'acetaminophen', 'morphine', 'insulin', 'antibiotic',
      'take', 'dose', 'mg', 'prescription', 'pill', 'tablet', 'medication'
    ],
    diagnoses: [
      'pneumonia', 'diabetes', 'cancer', 'tumor', 'hypertension', 'depression',
      'appendicitis', 'gastroenteritis', 'myocardial infarction', 'stroke', 'diagnosis'
    ],
    treatments: [
      'surgery', 'operation', 'chemotherapy', 'radiation', 'transplant',
      'need', 'require', 'should', 'must', 'treatment', 'therapy', 'immediate'
    ],
    advice: [
      'see a doctor', 'call 911', 'go to hospital', 'consult', 'recommend',
      'suggest', 'advise', 'cardiologist', 'neurologist', 'surgeon'
    ]
  };

  private emergencyMappings = {
    'heart attack': 'chest pain',
    'cannot breathe': 'difficulty breathing',
    'having a stroke': 'neurological symptoms'
  };

  async validateResponse(content: string): Promise<ValidationResult> {
    const filterResult = this.filterProhibitedTerms(content);
    
    // Check if too much content was filtered (>80% of original)
    const originalWordCount = content.split(/\s+/).length;
    const filteredWordCount = filterResult.filtered.split(/\s+/).length;
    
    if (originalWordCount > 0 && (filteredWordCount / originalWordCount) < 0.2) {
      return {
        isValid: false,
        filteredContent: '',
        warnings: filterResult.warnings,
        errors: ['Response contained too much prohibited medical content']
      };
    }

    return {
      isValid: true,
      filteredContent: filterResult.filtered,
      warnings: filterResult.warnings
    };
  }

  filterProhibitedTerms(content: string): FilterResult {
    let filtered = content;
    const lowerCaseFiltered = content.toLowerCase();
    const warnings: string[] = [];

    // Filter medications and advice
    for (const term of this.prohibitedTerms.medications) {
      if (lowerCaseFiltered.includes(term)) {
        filtered = filtered.replace(new RegExp(term, 'gi'), '[filtered]');
        if (!warnings.includes('Removed medical advice: medication recommendation')) {
          warnings.push('Removed medical advice: medication recommendation');
        }
      }
    }

    // Filter diagnoses
    for (const term of this.prohibitedTerms.diagnoses) {
      if (lowerCaseFiltered.includes(term)) {
        filtered = filtered.replace(new RegExp(term, 'gi'), '[filtered]');
        if (!warnings.includes('Removed prohibited term: medical diagnosis')) {
          warnings.push('Removed prohibited term: medical diagnosis');
        }
      }
    }

    // Filter treatment advice
    for (const term of this.prohibitedTerms.treatments) {
      if (lowerCaseFiltered.includes(term)) {
        filtered = filtered.replace(new RegExp(term, 'gi'), '[filtered]');
        if (!warnings.includes('Removed medical advice: treatment recommendation')) {
          warnings.push('Removed medical advice: treatment recommendation');
        }
      }
    }

    // Filter medical advice
    for (const term of this.prohibitedTerms.advice) {
      if (lowerCaseFiltered.includes(term)) {
        filtered = filtered.replace(new RegExp(term, 'gi'), '[filtered]');
        if (!warnings.includes('Removed medical advice: specialist referral')) {
          warnings.push('Removed medical advice: specialist referral');
        }
      }
    }

    // Convert emergency terminology to symptoms
    for (const [emergency, symptom] of Object.entries(this.emergencyMappings)) {
      if (lowerCaseFiltered.includes(emergency)) {
        filtered = filtered.replace(new RegExp(emergency, 'gi'), symptom);
        if (!warnings.includes('Converted emergency terminology to symptoms')) {
          warnings.push('Converted emergency terminology to symptoms');
        }
      }
    }

    // Clean up filtered text - replace [filtered] with empty string and normalize spaces
    filtered = filtered.replace(/\[filtered\]/g, ' ').replace(/\s+/g, ' ').trim();

    return { filtered, warnings };
  }
}