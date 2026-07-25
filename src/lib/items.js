import { supabase } from './supabase'

export async function listItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createItem(payload) {
  const { data, error } = await supabase.from('items').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateItem(id, payload) {
  const { data, error } = await supabase
    .from('items')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteItem(id) {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw error
}

export async function setPurchased(id, purchased) {
  return updateItem(id, {
    purchased,
    purchased_at: purchased ? new Date().toISOString() : null,
  })
}

export async function uploadPhoto(file) {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('item-photos').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('item-photos').getPublicUrl(path)
  return data.publicUrl
}
