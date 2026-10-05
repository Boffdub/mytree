import { File } from "expo-file-system";
import { supabase } from "./supabase";

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return {
    firstName: data.first_name,
    lastName: data.last_name,
    avatarUrl: data.avatar_url,
  };
}

export async function uploadAvatar(userId, localUri) {
  const file = new File(localUri);
  const arrayBuffer = await file.arrayBuffer();
  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function updateProfile(
  userId,
  { firstName, lastName, avatarUrl },
) {
  const updates = { first_name: firstName, last_name: lastName };
  if (avatarUrl) updates.avatar_url = avatarUrl;
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) throw error;
}
