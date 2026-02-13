/**
 * Parse driver's license image via Azure Document Intelligence (Supabase Edge Function).
 * Returns firstName, lastName, dateOfBirth if found.
 */

import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type LicenseParseResult = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
};

export async function parseLicense(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<LicenseParseResult> {
  const { data, error } = await supabase.functions.invoke<LicenseParseResult>('parse-license', {
    body: { imageBase64, mimeType },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      let msg = `License parse failed: ${error.context.status}`;
      try {
        const body = (await error.context.json()) as { error?: string; details?: string };
        if (body?.error || body?.details) {
          msg = `${body.error || body.details} (${error.context.status})`;
        }
      } catch (_) {
        // Response wasn't JSON, use status
      }
      throw new Error(msg);
    }
    throw new Error(error.message || 'Failed to parse license');
  }

  if (data && typeof data === 'object') {
    return data;
  }

  return {};
}
