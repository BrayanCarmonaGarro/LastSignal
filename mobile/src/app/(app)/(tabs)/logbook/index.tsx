import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator'; // ✅ Nueva importación
import { useCamera } from '@/hooks/useCamera'; 
import { storageApi } from '@/services/api/storage.api';
import { aiApi } from '@/services/api/ai.api';
import { logbookApi } from '@/services/api/logbook.api';

const API_URL = 'https://gigabyte-proofing-factoid.ngrok-free.dev/api'; 

export default function CameraScreen() {
  const {
    cameraRef,
    cameraStatus,
    isReady,
    askForPermission,
    lastPhoto,
    setLastPhoto
  } = useCamera();

  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'on' | 'off' | 'auto'>('off');
  const [error, setError] = useState<string | null>(null); // ✅ string con minúscula
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setLastPhoto(photo);
        setError(null);
      } catch (err) {
        setError('Error al capturar la foto.');
      }
    }
  };

  const toggleFacing = () => setFacing(current => (current === 'back' ? 'front' : 'back'));
  
  const toggleFlash = () => setFlashMode(current => (current === 'off' ? 'on' : 'off'));
  
  const clearPhoto = () => setLastPhoto(null);

  const saveToGallery = async (uri: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('¡Éxito!', 'Foto guardada en la galería.');
      } else {
        setError('Necesitamos permisos para guardar en la galería.');
      }
    } catch (err) {
      setError('Error al guardar la imagen.');
    }
  };

  const handleCreateLogbook = async () => {
    if (!lastPhoto) return;

    setIsProcessing(true);

    try {
      // -------------------------
      // 1. PROCESAR IMAGEN
      // -------------------------
      setProcessingStatus('Preparando imagen...');

      const manipResult = await ImageManipulator.manipulateAsync(
        lastPhoto.uri,
        [{ resize: { width: 512 } }],
        {
          compress: 0.4,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!manipResult.base64) {
        throw new Error('Error procesando imagen');
      }

      // -------------------------
      // 2. SUBIR
      // -------------------------
      setProcessingStatus('Subiendo imagen...');

      const upload = await storageApi.uploadImage(manipResult.base64);

      const fullImageUrl = upload.url_acceso;

      // -------------------------
      // 3. IA
      // -------------------------
      setProcessingStatus('Analizando con IA...');

      const aiData = await aiApi.analyzeImage(fullImageUrl);

      // -------------------------
      // 4. LOGBOOK
      // -------------------------
      setProcessingStatus('Guardando...');

      const logbook = await logbookApi.create({
        photo_url: fullImageUrl,
        description: aiData.description || "Sin descripción",
        classification: aiData.classification || "UNKNOWN_ORGANISM",
        danger_level: aiData.danger_level || "UNKNOWN",
      });

      Alert.alert(
        '¡Análisis completo!',
        `🧬 ${aiData.description}\n\n⚠️ ${aiData.danger_level}`
      );

      clearPhoto();

    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Error desconocido'
      );
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };
  // Renderizados
  if (cameraStatus === 'loading') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Verificando permisos...</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Necesitamos tu permiso para usar la cámara.</Text>
        <TouchableOpacity style={styles.button} onPress={askForPermission}>
          <Text style={styles.buttonText}>Otorgar Permisos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (lastPhoto) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: lastPhoto.uri }} style={styles.previewImage} />
        
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#00FF00" />
            <Text style={styles.processingText}>{processingStatus}</Text>
          </View>
        )}

        <View style={styles.previewControls}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={() => saveToGallery(lastPhoto.uri)}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={clearPhoto}>
              <Text style={styles.buttonText}>Nueva Foto</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.logbookButton]} 
            onPress={handleCreateLogbook}
            disabled={isProcessing}
          >
            <Text style={styles.logbookButtonText}>Crear Logbook con IA 🚀</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef} 
        style={styles.camera} 
        facing={facing} 
        flash={flashMode}
      >
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
            <Text style={styles.iconText}>
              Flash: {flashMode === 'off' ? '❌' : '⚡'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePhoto} />

          <TouchableOpacity style={styles.iconButton} onPress={toggleFacing}>
            <Text style={styles.iconText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  camera: { flex: 1, justifyContent: 'flex-end' },
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 40, paddingHorizontal: 20, backgroundColor: 'transparent' },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(0,0,0,0.2)' },
  iconButton: { padding: 15, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30 },
  iconText: { fontSize: 18, color: '#fff' },
  text: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  button: { padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  previewImage: { flex: 1, width: '100%' },
  previewControls: { position: 'absolute', bottom: 30, left: 20, right: 20, gap: 15 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  saveButton: { backgroundColor: '#333', flex: 1 },
  cancelButton: { backgroundColor: '#FF3B30', flex: 1 },
  logbookButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12 },
  logbookButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  processingText: { color: '#00FF00', marginTop: 15, fontSize: 16, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  errorContainer: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: 'rgba(255,0,0,0.7)', padding: 10, borderRadius: 8 },
  errorText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
