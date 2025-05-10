export interface FlashcardCore {
  question: string; // Keep as string, MathText will handle if it's empty/null by rendering nothing
  answer: string;   // Keep as string
}

export interface AppFlashcardClient extends FlashcardCore {
  id: string;
  isKnown: boolean;
}

// This type is used within FlashcardReview component state
export interface ReviewableFlashcard extends AppFlashcardClient {
  isFlipped: boolean;
}
