/**
 * Mirrors catalog.models.LessonPlan's choice fields. Kept in sync by hand
 * — Django and this app share no schema, so if the backend choices
 * change, update here too.
 */
export const CURRICULUM_CHOICES = [
  { value: 'NIGERIAN', label: 'Nigerian (WAEC / NECO / JAMB)' },
  { value: 'IGCSE', label: 'British (IGCSE)' },
];

export const CLASS_LEVEL_CHOICES_BY_CURRICULUM = {
  NIGERIAN: [
    { value: 'JSS1', label: 'JSS1' },
    { value: 'JSS2', label: 'JSS2' },
    { value: 'JSS3', label: 'JSS3' },
    { value: 'SS1', label: 'SS1' },
    { value: 'SS2', label: 'SS2' },
    { value: 'SS3', label: 'SS3' },
  ],
  IGCSE: [
    { value: 'YEAR7', label: 'Year 7' },
    { value: 'YEAR8', label: 'Year 8' },
    { value: 'YEAR9', label: 'Year 9' },
    { value: 'YEAR10', label: 'Year 10' },
    { value: 'YEAR11', label: 'Year 11' },
  ],
};

export const ABILITY_CHOICES = [
  { value: 'FAST', label: 'Fast learners' },
  { value: 'MODERATE', label: 'Moderate pace' },
  { value: 'SLOW', label: 'Slow learners' },
  { value: 'MIXED', label: 'Mixed ability' },
];