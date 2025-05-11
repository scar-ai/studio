// src/lib/supabase/decks.ts
'use server';

import type { Deck, StoredFlashcard } from '@/types/flashcard';
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
  
  // console.log("createDeck server action: Attempting to get user...");
  // const currentCookies = cookies().getAll();
  // console.log("createDeck server action: Current cookies:", currentCookies.map(c => c.name));


  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('Supabase auth.getUser() error in createDeck:', userError.message, userError);
    throw new Error(`Authentication error when trying to get user: ${userError.message}. Please ensure you are logged in and try again.`);
  }
  
  if (!userData || !userData.user) {
    console.error('No user data returned from Supabase auth.getUser() in createDeck. UserData:', userData);
    throw new Error('User not authenticated. No user data found. Please ensure you are logged in and try again.');
  }

  const user = userData.user;
  // console.log(`User authenticated in createDeck: ${user.id}`);

  const newDeckData = {
    user_id: user.id,
    name,
    flashcards,
    source_text: sourceMaterial?.text || null,
    source_image_uri: sourceMaterial?.imageUri || null,
    updated_at: new Date().toISOString(),
  };

  // console.log("createDeck server action: Attempting to insert deck for user:", user.id);
  const { data, error } = await supabase
    .from('decks')
    .insert(newDeckData)
    .select()
    .single();

  if (error) {
    console.error('Error creating deck in Supabase:', error);
    throw new Error(`Failed to save deck to database: ${error.message}`);
  }
  if (!data) {
    console.error('No data returned after inserting deck in Supabase.');
    throw new Error('Failed to save deck. The database operation returned no data.');
  }
  // console.log("createDeck server action: Deck saved successfully with ID:", data.id);
  return data as Deck;
}

export async function getDecksForUser(): Promise<Deck[]> {
  const supabase = createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('Supabase auth.getUser() error in getDecksForUser:', userError.message);
    // Depending on desired behavior, you might throw or return empty
    return []; // Silently fail for now, or consider throwing
  }
  if (!userData?.user) {
    console.warn('getDecksForUser: User not authenticated or no user data. Returning empty array.');
    return [];
  }
  const user = userData.user;

  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching decks for user from Supabase:', error);
    throw new Error(`Failed to fetch decks: ${error.message}`);
  }
  return (data as Deck[]) || [];
}

export async function getDeckById(deckId: string): Promise<Deck | null> {
  const supabase = createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('Supabase auth.getUser() error in getDeckById:', userError.message);
    throw new Error(`Authentication error: ${userError.message}`);
  }
  if (!userData?.user) {
    console.error('No user data returned from Supabase auth.getUser() in getDeckById.');
    throw new Error('User not authenticated. No user data found.');
  }
  const user = userData.user;

  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .eq('user_id', user.id) // Ensure user owns the deck
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // PostgREST error for "Searched item was not found"
      console.warn(`Deck with ID ${deckId} not found for user ${user.id}.`);
      return null;
    }
    console.error('Error fetching deck by ID from Supabase:', error);
    throw new Error(`Failed to fetch deck: ${error.message}`);
  }
  return data as Deck | null;
}

export async function deleteDeckById(deckId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('Supabase auth.getUser() error in deleteDeckById:', userError.message);
    return { success: false, error: `Authentication error: ${userError.message}` };
  }
  if (!userData?.user) {
    console.error('No user data returned from Supabase auth.getUser() in deleteDeckById.');
    return { success: false, error: 'User not authenticated. No user data found.' };
  }
  const user = userData.user;

  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId)
    .eq('user_id', user.id); // Ensure user owns the deck

  if (error) {
    console.error('Error deleting deck from Supabase:', error);
    return { success: false, error: `Failed to delete deck: ${error.message}` };
  }
  return { success: true };
}

export async function updateDeckName(deckId: string, newName: string): Promise<Deck> {
  const supabase = createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('Supabase auth.getUser() error in updateDeckName:', userError.message);
    throw new Error(`Authentication error: ${userError.message}`);
  }
  if (!userData?.user) {
    console.error('No user data returned from Supabase auth.getUser() in updateDeckName.');
    throw new Error('User not authenticated. No user data found.');
  }
  const user = userData.user;

  const { data, error } = await supabase
    .from('decks')
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq('id', deckId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating deck name in Supabase:', error);
    throw new Error(`Failed to update deck name: ${error.message}`);
  }
  if (!data) {
    console.error('No data returned after updating deck name in Supabase.');
    throw new Error('Failed to update deck name. The database operation returned no data.');
  }
  return data as Deck;
}
