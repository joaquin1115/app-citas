import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import {
  Calendar,
  Clock,
  User,
  FileText,
  ChevronRight,
  Plus,
  X,
  Save,
  Stethoscope,
  Heart,
  Activity,
  Brain,
  Thermometer,
  Clipboard,
  FileCheck,
  Pill,
  Syringe,
  Bed,
  Scissors,
  CheckCircle
} from 'lucide-react';
import MedicalRecordDetail from './MedicalRecords';

const MedicalServices: React.FC = () => {
  const { user } = useUser();
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderType, setOrderType] = useState<'exam' | 'surgery' | 'therapy' | 'consultation' | null>(null);
  const [showAttentionForm, setShowAttentionForm] = useState(false);
  const [attentionType, setAttentionType] = useState<'triage' | 'exam' | 'diagnosis' | 'hospitalization' | 'treatment' | null>(null);
  const [treatmentType, setTreatmentType] = useState<'medication' | 'therapy' | 'surgery' | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [showMedicalRecord, setShowMedicalRecord] = useState(false);
  const [isAttentionComplete, setIsAttentionComplete] = useState(false);

  // ... (keep existing code until the selectedAppointment rendering)

  const handleCompleteAttention = () => {
    setIsAttentionComplete(true);
    // Here you would typically save all the attention data to the database
    setSelectedAppointment(null);
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Servicios Médicos</h1>
      </div>

      {selectedAppointment ? (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <button
                  onClick={() => {
                    setSelectedAppointment(null);
                    setShowOrderForm(false);
                    setOrderType(null);
                    setShowAttentionForm(false);
                    setAttentionType(null);
                    setTreatmentType(null);
                    setShowMedicalRecord(false);
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                >
                  <span className="mr-1">←</span> Volver
                </button>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {appointments.find(a => a.id === selectedAppointment)?.patientName}
                </h2>
                <p className="text-gray-600">
                  {appointments.find(a => a.id === selectedAppointment)?.reason}
                </p>
              </div>
              <div className="flex space-x-3">
                {!showOrderForm && !showAttentionForm && !showMedicalRecord && (
                  <>
                    <button
                      onClick={() => setShowMedicalRecord(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
                    >
                      <FileText size={20} className="mr-2" />
                      Ver Historia Clínica
                    </button>
                    <button
                      onClick={() => setShowAttentionForm(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                    >
                      <FileCheck size={20} className="mr-2" />
                      Registrar Atención
                    </button>
                    <button
                      onClick={() => setShowOrderForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus size={20} className="mr-2" />
                      Generar Orden
                    </button>
                  </>
                )}
              </div>
            </div>

            {showMedicalRecord ? (
              <MedicalRecordDetail 
                recordId={selectedAppointment} 
                onBack={() => setShowMedicalRecord(false)}
                showTreatmentOptions={true}
              />
            ) : showAttentionForm ? (
              <div className="space-y-6">
                {renderAttentionForm()}
                {attentionType && (
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowAttentionForm(false);
                        setAttentionType(null);
                        setTreatmentType(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveAttention}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Save size={20} className="mr-2" />
                      Guardar Atención
                    </button>
                  </div>
                )}
              </div>
            ) : showOrderForm ? (
              // ... (keep existing order form code)
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Detalles de la Cita</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="font-medium">
                        {appointments.find(a => a.id === selectedAppointment)?.date}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hora</p>
                      <p className="font-medium">
                        {appointments.find(a => a.id === selectedAppointment)?.time}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary of attention and orders */}
                {(isAttentionComplete || showAttentionForm || showOrderForm) && (
                  <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      <h3 className="text-lg font-medium text-green-800">Resumen de la Atención</h3>
                    </div>
                    <div className="space-y-4">
                      {/* Add summary items here */}
                    </div>
                  </div>
                )}

                {/* Complete Attention Button */}
                {(showAttentionForm || showOrderForm || isAttentionComplete) && (
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleCompleteAttention}
                      className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                    >
                      <CheckCircle size={20} className="mr-2" />
                      Finalizar Atención
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // ... (keep existing appointments list code)
      )}
    </div>
  );
};

export default MedicalServices;