import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private bucket = 'sprezox-files';

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  async uploadFile(
    folder: string,
    file: { originalname: string; buffer: Buffer; mimetype: string },
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const ext = file.originalname.split('.').pop();
    const path = `${folder}/${randomUUID()}.${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /** For private files (pitch decks) - returns the storage path, not a public URL */
  async uploadPrivateFile(
    folder: string,
    file: { originalname: string; buffer: Buffer; mimetype: string },
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const ext = file.originalname.split('.').pop();
    const path = `${folder}/${randomUUID()}.${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    return path;
  }

  async getSignedUrl(path: string, expiresInSeconds = 300): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data) {
      throw new BadRequestException(`Could not generate file URL: ${error?.message}`);
    }

    return data.signedUrl;
  }
}