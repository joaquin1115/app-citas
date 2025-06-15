import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Parse request body
    const requestData = await req.json();
    // Extract data from request
    const { persona, roles, paciente, personal_medico, asistente_administrativo, password } = requestData;
    // Validate required fields
    if (!persona || !roles || !password) {
      return new Response(JSON.stringify({
        error: "Datos básicos de persona y roles son requeridos"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Create Supabase admin client
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      db: {
        schema: 'public'
      }
    });
    // Create user in auth schema
    const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: persona.correo_electronico,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: `${persona.prenombres} ${persona.primer_apellido}`,
        document: persona.dni_idcarnet,
        roles: roles.map((r)=>r.role),
        require_password_change: true,
        first_login: true
      }
    });
    if (authError) throw authError;
    // Insert persona
    const { data: personaData, error: personaError } = await supabaseAdmin.from('persona').insert({
      prenombres: persona.prenombres,
      primer_apellido: persona.primer_apellido,
      segundo_apellido: persona.segundo_apellido,
      dni_idcarnet: persona.dni_idcarnet,
      sexo: persona.sexo,
      fecha_nacimiento: persona.fecha_nacimiento,
      direccion_legal: persona.direccion_legal,
      correo_electronico: persona.correo_electronico,
      numero_celular_personal: persona.numero_celular_personal,
      numero_celular_emergencia: persona.numero_celular_emergencia
    }).select('id_persona').single();
    if (personaError) throw personaError;
    const personaId = personaData.id_persona;
    // Update auth user with persona ID
    await supabaseAdmin.auth.admin.updateUserById(user.user.id, {
      user_metadata: {
        ...user.user.user_metadata,
        persona_id: personaId
      }
    });
    // Handle patient data if exists
    if (roles.some((r)=>r.role === 'Paciente') && paciente) {
      // Create medical profile
      const { data: perfilMedicoData, error: perfilError } = await supabaseAdmin.from('perfil_medico').insert({
        fecha_atencion: new Date().toISOString(),
        grupo_sanguineo: null,
        ambiente_residencia: null,
        orientacion_sexual: null,
        vida_sexual_activa: null
      }).select('id_perfil_medico').single();
      if (perfilError) throw perfilError;
      // Create clinical history
      const { data: historiaData, error: historiaError } = await supabaseAdmin.from('historia_clinica').insert({
        id_estado: 1,
        id_perfil_medico: perfilMedicoData.id_perfil_medico,
        fecha_creacion: new Date().toISOString()
      }).select('id_historia').single();
      if (historiaError) throw historiaError;
      // Insert patient
      const { error: pacienteError } = await supabaseAdmin.from('paciente').insert({
        id_persona: personaId,
        id_historia: historiaData.id_historia,
        tipo_seguro: paciente.tipoSeguro,
        situacion_juridica: paciente.situacionJuridica,
        esta_vivo: paciente.estaVivo,
        etapa_vida: paciente.etapaVida
      });
      if (pacienteError) throw pacienteError;
    }
    // Handle medical staff data if exists
    if (roles.some((r)=>r.role === 'Personal Médico')) {
      if (!personal_medico) {
        throw new Error('Datos de personal médico requeridos');
      }
      const { error: personalMedicoError } = await supabaseAdmin.from('personal_medico').insert({
        id_persona: personaId,
        id_especialidad: personal_medico.especialidad,
        licencia_medica: personal_medico.licenciaMedica,
        colegiatura: personal_medico.colegiatura,
        habilitado: true,
        institucion_asociada: personal_medico.institucionAsociada
      });
      if (personalMedicoError) throw personalMedicoError;
    }
    // Handle administrative assistant data if exists
    if (roles.some((r)=>r.role === 'Asistente Administrativo')) {
      if (!asistente_administrativo) {
        throw new Error('Datos de asistente administrativo requeridos');
      }
      const { error: asistenteError } = await supabaseAdmin.from('administrador').insert({
        id_persona: personaId,
        cargo: asistente_administrativo.cargo,
        nivel_acceso: asistente_administrativo.nivelAcceso
      });
      if (asistenteError) throw asistenteError;
    }
    // Assign roles
    for (const role of roles){
      // First check if role exists
      const { data: roleData, error: roleError } = await supabaseAdmin.from('rol').select('id_rol').eq('nombre', role.role).maybeSingle();
      if (roleError) throw roleError;
      let roleId;
      roleId = roleData.id_rol;
      // Assign role to person
      const { error: asignacionError } = await supabaseAdmin.from('asignacion_rol').insert({
        id_persona: personaId,
        id_rol: roleId,
        fecha_asignacion: new Date().toISOString(),
        fecha_expiracion: role.expiration || null
      });
      if (asignacionError) throw asignacionError;
    }
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.user.id,
        email: user.user.email,
        name: `${persona.prenombres} ${persona.primer_apellido}`,
        persona_id: personaId
      }
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      details: error.details || null
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
