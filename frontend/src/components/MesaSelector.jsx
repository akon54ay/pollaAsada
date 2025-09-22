import React, { useState, useEffect } from 'react';
import { mozoService } from '../services/api';
import toast from 'react-hot-toast';

const MesaSelector = ({ selectedMesa, onSelectMesa, isClientMode = false }) => {
  const [mesasOcupadas, setMesasOcupadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validatingMesa, setValidatingMesa] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

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
    
    // Auto-actualizar cada 5 segundos para mantener el estado actualizado
    const interval = setInterval(() => {
      fetchMesasOcupadas();
      setLastUpdate(Date.now());
    }, 5000);
    
    return () => clearInterval(interval);
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

  const handleSelectMesa = async (mesa) => {
    // Si la mesa ya está marcada como ocupada localmente, no permitir selección
    if (isMesaOcupada(mesa.numero)) {
      toast.error(`❌ La mesa ${mesa.numero} ya está ocupada. Por favor, elige otra disponible.`, {
        duration: 4000
      });
      return;
    }
    
    // Si es modo cliente, validar con el servidor antes de confirmar
    if (isClientMode) {
      setValidatingMesa(mesa.numero);
      try {
        const response = await mozoService.verificarEstadoMesa(mesa.numero);
        
        if (response.data.ocupada) {
          // La mesa está ocupada, actualizar el estado local y mostrar mensaje
          setMesasOcupadas(prev => [...prev, mesa.numero.toString()]);
          
          const info = response.data.info;
          toast.error(
            <div>
              <strong>❌ Mesa {mesa.numero} ocupada</strong>
              <br />
              <small>Cliente: {info.cliente || 'Sin nombre'}</small>
              <br />
              <small>Tiempo: {info.tiempo_ocupacion_minutos} min</small>
              <br />
              <small>Por favor, elige otra mesa disponible.</small>
            </div>,
            { duration: 5000 }
          );
        } else {
          // Mesa disponible, proceder con la selección
          onSelectMesa(mesa.numero.toString());
          toast.success(`✅ Mesa ${mesa.numero} seleccionada correctamente`, {
            duration: 2000
          });
        }
      } catch (error) {
        console.error('Error al verificar estado de mesa:', error);
        toast.error('Error al verificar disponibilidad de la mesa');
      } finally {
        setValidatingMesa(null);
      }
    } else {
      // Si no es modo cliente, seleccionar directamente
      onSelectMesa(mesa.numero.toString());
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card-polleria">
        <h2 className="brand-title text-3xl mb-6 text-center" style={{ color: 'var(--color-marron)' }}>
          🔥 SELECCIONA TU MESA 🔥
        </h2>
        
        {/* Indicador de estado */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            {loading && (
              <span className="text-sm animate-pulse" style={{ color: 'var(--color-naranja)' }}>
                🔄 Actualizando...
              </span>
            )}
            <span className="text-xs" style={{ color: 'var(--color-marron)' }}>
              ⏱️ Actualizado hace {Math.floor((Date.now() - lastUpdate) / 1000)}s
            </span>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 text-xs mb-4 p-3 rounded-lg" style={{ background: 'rgba(255, 248, 220, 0.5)' }}>
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
        <div className="grill-effect rounded-lg p-4 border-2" style={{ borderColor: 'var(--color-dorado)' }}>
          <div className="text-center mb-3 text-sm font-bold" style={{ color: 'var(--color-marron)' }}>
            🚪 ENTRADA PRINCIPAL 🚪
          </div>
        
        <div className="grid grid-cols-4 gap-3">
          {configuracionMesas.map(mesa => (
            <div
              key={mesa.numero}
              onClick={() => handleSelectMesa(mesa)}
              className={`
                relative p-4 rounded-lg border-2 transition-all transform hover:scale-105
                ${getColorMesa(mesa)}
                ${validatingMesa === mesa.numero ? 'opacity-50 cursor-wait' : ''}
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
              
              {/* Indicador de validación */}
              {validatingMesa === mesa.numero && (
                <div className="absolute inset-0 bg-white bg-opacity-80 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-xs mt-2 text-gray-600">Verificando...</p>
                  </div>
                </div>
              )}
              
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
          
          <div className="text-center mt-3 text-sm font-bold" style={{ color: 'var(--color-marron)' }}>
            🍳 COCINA 🍳
          </div>
        </div>

        {/* Mesa seleccionada actual */}
        {selectedMesa && (
          <div className="mt-4 p-3 rounded-lg badge-fuego">
            <p className="text-sm text-white text-center font-bold">
              ✅ Mesa {selectedMesa} seleccionada
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MesaSelector;
