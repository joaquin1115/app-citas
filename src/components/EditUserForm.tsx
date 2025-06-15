import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface EditUserFormProps {
  userData: any;
  onClose: () => void;
}

const ALL_ROLES = [
  'Paciente',
  'Personal Médico',
  'Asistente Administrativo',
  'Jefe de Servicio Médico'
];

const EditUserForm: React.FC<EditUserFormProps> = ({ userData, onClose }) => {
  const [formData, setFormData] = useState({
    prenombres: userData.prenombres || '',
    primer_apellido: userData.primer_apellido || '',
    segundo_apellido: userData.segundo_apellido || '',
    correo_electronico: userData.correo_electronico || '',
    direccion_legal: userData.direccion_legal || '',
  });

  const currentRoles = (userData.asignacion_rol || []).map((r: any) => r.rol?.nombre);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles([...selectedRoles, role]);
    } else {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    }
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSave = async () => {
    setError('');

    const { prenombres, primer_apellido, correo_electronico, direccion_legal } = formData;
    if (!prenombres || !primer_apellido || !correo_electronico || !direccion_legal) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (!validateEmail(correo_electronico)) {
      setError('El correo no tiene un formato válido.');
      return;
    }

    setSaving(true);
    try {
      // Actualizar persona
      const { error: personaError } = await supabase
        .from('persona')
        .update(formData)
        .eq('id_persona', userData.id_persona);

      if (personaError) throw personaError;

      // Actualizar roles (simplificado: elimina y vuelve a insertar)
      const { data: allRoles } = await supabase
        .from('rol')
        .select('id_rol, nombre');

      const roleMap: Record<string, number> = {};
      allRoles?.forEach(r => roleMap[r.nombre] = r.id_rol);

      // Eliminar roles actuales
      await supabase
        .from('asignacion_rol')
        .delete()
        .eq('id_persona', userData.id_persona);

      // Insertar roles nuevos
      const newRoles = selectedRoles.map(role => ({
        id_persona: userData.id_persona,
        id_rol: roleMap[role],
        fecha_asignacion: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('asignacion_rol')
        .insert(newRoles);

      if (insertError) throw insertError;

      // Cambiar contraseña si aplica
      if (changingPassword && newPassword) {
        const { data: authUsers } = await supabase
          .from('persona')
          .select('correo_electronico')
          .eq('id_persona', userData.id_persona)
          .single();

        const { data: userByEmail, error: userError } = await supabase.auth.admin.getUserByEmail(
          authUsers.correo_electronico
        );

        if (userError || !userByEmail?.user?.id) {
          throw new Error('ID de autenticación no encontrado.');
        }

        const { error: passError } = await supabase.auth.admin.updateUserById(
          userByEmail.user.id,
          { password: newPassword }
        );

        if (passError) throw passError;
      }

      alert('Usuario actualizado correctamente.');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al actualizar el usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Editar Usuario</h2>

        {error && <div className="text-red-600">{error}</div>}

        <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="prenombres">Nombre</label>
                <input
                    id="prenombres"
                    name="prenombres"
                    value={formData.prenombres}
                    onChange={handleChange}
                    className="border p-2 rounded"
                />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="primer_apellido">Primer Apellido</label>
                <input
                    id="primer_apellido"
                    name="primer_apellido"
                    value={formData.primer_apellido}
                    onChange={handleChange}
                    className="border p-2 rounded"
                />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="segundo_apellido">Segundo Apellido</label>
                <input
                    id="segundo_apellido"
                    name="segundo_apellido"
                    value={formData.segundo_apellido}
                    onChange={handleChange}
                    className="border p-2 rounded"
                />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="correo_electronico">Correo Electrónico</label>
                <input
                    id="correo_electronico"
                    name="correo_electronico"
                    value={formData.correo_electronico}
                    onChange={handleChange}
                    className="border p-2 rounded"
                />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="direccion_legal">Dirección Legal</label>
                <input
                    id="direccion_legal"
                    name="direccion_legal"
                    value={formData.direccion_legal}
                    onChange={handleChange}
                    className="border p-2 rounded"
                />
            </div>
        </div>

        <div>
          <p className="font-medium text-gray-700 mt-4">Roles</p>
          {ALL_ROLES.map(role => (
            <label key={role} className="flex items-center space-x-2 mt-1">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={(e) => handleRoleChange(role, e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm">{role}</span>
            </label>
          ))}
        </div>

        {!changingPassword ? (
          <button
            onClick={() => setChangingPassword(true)}
            className="text-blue-600 text-sm underline"
          >
            Cambiar contraseña
          </button>
        ) : (
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border p-2 rounded w-full"
          />
        )}

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserForm;
