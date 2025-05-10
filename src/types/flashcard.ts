export interface FlashcardCore {
  question: string;
  answer: string;
}

export interface AppFlashcardClient extends FlashcardCore {
  id: string;
  isKnown: boolean;
}

// This type is used within FlashcardReview component state
export interface ReviewableFlashcard extends AppFlashcardClient {
  isFlipped: boolean;
}
