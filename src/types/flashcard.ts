export interface FlashcardCore {
  question: string;
  answer: string;
}

export interface AppFlashcardClient extends FlashcardCore {
  id: string; // Client-side unique ID for React keys, etc.
  isKnown: boolean;
}

// This type is used within FlashcardReview component state
export interface ReviewableFlashcard extends AppFlashcardClient {
  isFlipped: boolean;
}

// Represents a flashcard as stored in the database (part of a Deck)
export interface StoredFlashcard extends FlashcardCore {}

// Represents a deck as stored in and retrieved from Supabase
export interface Deck {
  id: string; // UUID from Supabase
  user_id: string;
  name: string;
  flashcards: StoredFlashcard[];
  source_text: string | null;
  source_image_uri: string | null;
  created_at: string; // ISO string date
  updated_at: string; // ISO string date
  is_public?: boolean; // For future sharing
  share_token?: string | null; // For future link-based sharing
}
