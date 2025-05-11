// src/lib/supabase/decks.ts
'use server';

import { supabase } from '@/lib/supabase/client'; // Using client for server actions requires care, or a server client
import type { Deck, StoredFlashcard, FlashcardCore } from '@/types/flashcard';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to get a server-side Supabase client
function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

export async function createDeck(
  name: string,
  flashcards: StoredFlashcard[],
  sourceMaterial: { text?: string; imageUri?: string } | null
): Promise<Deck> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const newDeckData = {
    user_id: user.id,
    name,
    flashcards,
    source_text: sourceMaterial?.text || null,
    source_image_uri: sourceMaterial?.imageUri || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('decks')
    .insert(newDeckData)
    .select()
    .single();

  if (error) {
    console.error('Error creating deck:', error);
    throw new Error(`Failed to save deck: ${error.message}`);
  }
  if (!data) {
    throw new Error('Failed to save deck. The operation returned no data.');
  }
  return data as Deck;
}

export async function getDecksForUser(): Promise<Deck[]> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn('getDecksForUser: User not authenticated, returning empty array.');
    return [];
  }

  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching decks for user:', error);
    throw new Error(`Failed to fetch decks: ${error.message}`);
  }
  return (data as Deck[]) || [];
}

export async function getDeckById(deckId: string): Promise<Deck | null> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .eq('user_id', user.id) // Ensure user owns the deck
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // PostgREST error for "Searched item was not found"
      return null;
    }
    console.error('Error fetching deck by ID:', error);
    throw new Error(`Failed to fetch deck: ${error.message}`);
  }
  return data as Deck | null;
}

export async function deleteDeckById(deckId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId)
    .eq('user_id', user.id); // Ensure user owns the deck

  if (error) {
    console.error('Error deleting deck:', error);
    return { success: false, error: `Failed to delete deck: ${error.message}` };
  }
  return { success: true };
}

export async function updateDeckName(deckId: string, newName: string): Promise<Deck> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('decks')
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq('id', deckId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating deck name:', error);
    throw new Error(`Failed to update deck name: ${error.message}`);
  }
  if (!data) {
    throw new Error('Failed to update deck name. The operation returned no data.');
  }
  return data as Deck;
}
