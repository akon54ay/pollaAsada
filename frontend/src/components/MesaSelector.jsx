import React, { useState, useEffect } from 'react';
import { mozoService } from '../services/api';

const MesaSelector = ({ selectedMesa, onSelectMesa, isClientMode = false }) => {
  const [mesasOcupadas, setMesasOcupadas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Configuración de mesas del restaurante
  const configuracionMesas = [
    { numero: 1, capacidad: 2, fila: 1, columna: 1 },
    { numero: 2, capacidad: 2, fila: 1, columna: 2 },
    { numero: 3, capacidad: 4, fila: 1, columna: 3 },
    { numero: 4, capacidad: 4, fila: 1, columna: 4 },
    
    { numero: 5, capacidad: 4, fila: 2, columna: 1 },
    { numero: 6, capacidad: 6, fila: 2, columna: 2 },
    { numero: 7, capacidad: 6, fila: 2, columna: 3 },
    { numero: 8, capacidad: 2, fila: 2, columna: 4 },
    
    { numero: 9, capacidad: 4, fila: 3, columna: 1 },
    { numero: 10, capacidad: 4, fila: 3, columna: 2 },
    { numero: 11, capacidad: 8, fila: 3, columna: 3 },
    { numero: 12, capacidad: 2, fila: 3, columna: 4 },
  ];

  useEffect(() => {
    fetchMesasOcupadas();
  }, []);

  const fetchMesasOcupadas = async () => {
    try {
      setLoading(true);
      const response = await mozoService.getMesasActivas();
      setMesasOcupadas(response.data || []);
    } catch (error) {
      console.error('Error al obtener mesas ocupadas:', error);
      setMesasOcupadas([]);
    } finally {
      setLoading(false);
    }
  };

  const isMesaOcupada = (numeroMesa) => {
    return mesasOcupadas.some(mesa => mesa === numeroMesa || mesa === numeroMesa.toString());
  };

  const getColorMesa = (mesa) => {
    if (selectedMesa === mesa.numero.toString()) {
      return 'bg-blue-500 text-white border-blue-600';
    }
    if (isMesaOcupada(mesa.numero)) {
      return 'bg-red-100 text-red-700 border-red-300 cursor-not-allowed opacity-75';
    }
    if (mesa.capacidad <= 2) {
      return 'bg-green-50 hover:bg-green-100 border-green-300 cursor-pointer';
    }
    if (mesa.capacidad <= 4) {
      return 'bg-yellow-50 hover:bg-yellow-100 border-yellow-300 cursor-pointer';
    }
    return 'bg-purple-50 hover:bg-purple-100 border-purple-300 cursor-pointer';
  };

  const getIconMesa = (capacidad) => {
    if (capacidad <= 2) return '👥';
    if (capacidad <= 4) return '👨‍👩‍👧‍👦';
    return '👨‍👩‍👧‍👦👨‍👩‍👧‍👦';
  };

  const handleSelectMesa = (mesa) => {
    if (!isMesaOcupada(mesa.numero)) {
      onSelectMesa(mesa.numero.toString());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">
          {isClientMode ? '🪑 Selecciona tu Mesa' : 'Mesa del Cliente'}
        </h3>
        {loading && (
          <span className="text-sm text-gray-500">Actualizando...</span>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 text-xs mb-4">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-50 border border-green-300 rounded"></div>
          <span>2 personas</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-yellow-50 border border-yellow-300 rounded"></div>
          <span>4 personas</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-purple-50 border border-purple-300 rounded"></div>
          <span>6-8 personas</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span>Ocupada</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
          <span>Seleccionada</span>
        </div>
      </div>

      {/* Grid de mesas */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-center mb-3 text-sm text-gray-600">
          🚪 Entrada Principal 🚪
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {configuracionMesas.map(mesa => (
            <div
              key={mesa.numero}
              onClick={() => handleSelectMesa(mesa)}
              className={`
                relative p-4 rounded-lg border-2 transition-all transform hover:scale-105
                ${getColorMesa(mesa)}
              `}
              style={{
                gridRow: mesa.fila,
                gridColumn: mesa.columna,
              }}
            >
              {/* Número de mesa */}
              <div className="text-center">
                <div className="text-2xl mb-1">{getIconMesa(mesa.capacidad)}</div>
                <div className="font-bold text-lg">Mesa {mesa.numero}</div>
                <div className="text-xs opacity-75">
                  {mesa.capacidad} personas
                </div>
              </div>
              
              {/* Indicador de ocupada */}
              {isMesaOcupada(mesa.numero) && (
                <div className="absolute top-1 right-1">
                  <span className="text-xs bg-red-500 text-white px-1 py-0.5 rounded">
                    Ocupada
                  </span>
                </div>
              )}
              
              {/* Indicador de seleccionada */}
              {selectedMesa === mesa.numero.toString() && (
                <div className="absolute top-1 left-1">
                  <span className="text-xs bg-blue-500 text-white px-1 py-0.5 rounded">
                    ✓
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center mt-3 text-sm text-gray-600">
          🍳 Cocina 🍳
        </div>
      </div>

      {/* Mesa seleccionada actual */}
      {selectedMesa && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Mesa seleccionada:</span> Mesa {selectedMesa}
          </p>
        </div>
      )}
    </div>
  );
};

export default MesaSelector;
