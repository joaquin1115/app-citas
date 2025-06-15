import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as faceapi from 'https://esm.sh/face-api.js@0.22.2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // 1. Configuración con Service Role Key
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    const { descriptor } = await req.json();
    // 2. Validación del descriptor
    if (!descriptor || !Array.isArray(descriptor)) {
      return new Response(JSON.stringify({
        error: 'Descriptor inválido'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 3. Obtener descriptores registrados
    const { data: descriptors, error: fetchError } = await supabaseAdmin.from('facial_descriptors').select('user_id, descriptor');
    if (fetchError) throw fetchError;
    // 4. Comparación facial
    const labeledDescriptors = descriptors.map((d)=>({
        label: d.user_id,
        descriptors: [
          new Float32Array(d.descriptor)
        ]
      }));
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors.map((ld)=>new faceapi.LabeledFaceDescriptors(ld.label, ld.descriptors)), 0.6);
    const bestMatch = faceMatcher.findBestMatch(new Float32Array(descriptor));
    if (bestMatch.label === 'unknown') {
      return new Response(JSON.stringify({
        error: 'Rostro no reconocido'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 5. Obtener email del usuario (requiere que los usuarios tengan email en auth.users)
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(bestMatch.label);
    if (userError) throw userError;
    if (!user.email) throw new Error('El usuario no tiene email registrado');
    // 6. Generar magic link (Método alternativo)
    const { data: magicLink, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/callback`
      }
    });
    if (linkError) throw linkError;
    if (!magicLink.properties?.hashed_token) {
      throw new Error('No se pudo generar el token de autenticación');
    }
    // 7. Crear sesión con el token (usando cliente público)
    const supabasePublic = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    const { data: session, error: sessionError } = await supabasePublic.auth.verifyOtp({
      type: 'magiclink',
      token_hash: magicLink.properties.hashed_token
    });
    if (sessionError) throw sessionError;
    // 8. Respuesta exitosa
    return new Response(JSON.stringify({
      success: true,
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      user: {
        id: user.id,
        email: user.email
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Error en el servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
