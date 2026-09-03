'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireCurrentClientContext } from '@/lib/queries/client-context';
export async function markNotificationRead(formData: FormData) { const parsed = z.string().uuid().safeParse(formData.get('notificationId')); if (!parsed.success) throw new Error('Invalid notification'); const { supabase } = await requireCurrentClientContext(); const { error } = await supabase!.rpc('mark_notification_read', { target_notification: parsed.data }); if (error) throw new Error('Notification could not be updated'); revalidatePath('/client/notifications'); revalidatePath('/client/dashboard'); }
export async function markAllNotificationsRead() { const { supabase } = await requireCurrentClientContext(); const { error } = await supabase!.rpc('mark_all_notifications_read'); if (error) throw new Error('Notifications could not be updated'); revalidatePath('/client/notifications'); revalidatePath('/client/dashboard'); }
