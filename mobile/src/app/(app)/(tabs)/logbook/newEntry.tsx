import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import { useCamera } from '@/hooks/useCamera';
import { storageApi } from '@/services/api/storage.api';
import { aiApi } from '@/services/api/ai.api';
import { logbookApi } from '@/services/api/logbook.api';

export default function NewEntryScreen() {
  const {
    cameraRef,
    cameraStatus,
    isReady,
    askForPermission,
    lastPhoto,
    setLastPhoto,
  } = useCamera();

  const [facing,           setFacing]           = useState<'front' | 'back'>('back');
  const [flashMode,        setFlashMode]        = useState<'on' | 'off' | 'auto'>('off');
  const [error,            setError]            = useState<string | null>(null);
  const [isProcessing,     setIsProcessing]     = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync();
      setLastPhoto(photo);
      setError(null);
    } catch {
      setError('Error al capturar la foto.');
    }
  };

  const toggleFacing = () => setFacing((c) => (c === 'back' ? 'front' : 'back'));
  const toggleFlash  = () => setFlashMode((c) => (c === 'off' ? 'on' : 'off'));
  const clearPhoto   = () => setLastPhoto(null);

  const saveToGallery = async (uri: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('¡Éxito!', 'Foto guardada en la galería.');
      } else {
        setError('Necesitamos permisos para guardar en la galería.');
      }
    } catch {
      setError('Error al guardar la imagen.');
    }
  };

  const handleCreateLogbook = async () => {
    if (!lastPhoto) return;
    setIsProcessing(true);
    try {
      setProcessingStatus('Preparando imagen...');
      const manipResult = await ImageManipulator.manipulateAsync(
        lastPhoto.uri,
        [{ resize: { width: 512 } }],
        { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!manipResult.base64) throw new Error('Error procesando imagen');

      setProcessingStatus('Subiendo imagen...');
      const upload = await storageApi.uploadImage(manipResult.base64);

      setProcessingStatus('Analizando con IA...');
      const aiData = await aiApi.analyzeImage(upload.url_acceso);

      setProcessingStatus('Guardando...');
      const response = await logbookApi.create({
        photo_url:      upload.url_acceso,
        description:    aiData.description    || 'Sin descripción',
        classification: aiData.classification || 'UNKNOWN_ORGANISM',
        danger_level:   aiData.danger_level   || 'UNKNOWN',
      });

      const similarMsg = response.similar_findings?.length > 0 
        ? `\n\n📚 Hallazgos similares:\n- ${response.similar_findings.join('\n- ')}`
        : '\n\n🆕 Primer registro de este espécimen.';

      Alert.alert(
        '¡Análisis completo!', 
        `🧬 ${aiData.description}\n\n⚠️ Peligro: ${aiData.danger_level}${similarMsg}`
      );
      
      clearPhoto();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  if (cameraStatus === 'loading') {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={s.text}>Verificando permisos...</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={s.center}>
        <Text style={s.text}>Necesitamos tu permiso para usar la cámara.</Text>
        <TouchableOpacity style={s.btn} onPress={askForPermission}>
          <Text style={s.btnText}>Otorgar Permisos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (lastPhoto) {
    return (
      <View style={s.container}>
        <Image source={{ uri: lastPhoto.uri }} style={s.preview} />

        {isProcessing && (
          <View style={s.processingOverlay}>
            <ActivityIndicator size="large" color="#00FF00" />
            <Text style={s.processingText}>{processingStatus}</Text>
          </View>
        )}

        <View style={s.previewControls}>
          <View style={s.row}>
            <TouchableOpacity style={[s.btn, s.btnGray]} onPress={() => saveToGallery(lastPhoto.uri)}>
              <Text style={s.btnText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.btnRed]} onPress={clearPhoto}>
              <Text style={s.btnText}>Nueva Foto</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[s.btn, s.btnBlue]}
            onPress={handleCreateLogbook}
            disabled={isProcessing}
          >
            <Text style={s.btnTextLg}>Crear Logbook con IA 🚀</Text>
          </TouchableOpacity>
          {error ? <Text style={s.error}>{error}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <CameraView ref={cameraRef} style={s.camera} facing={facing} flash={flashMode}>
        <View style={s.controls}>
          <TouchableOpacity style={s.iconBtn} onPress={toggleFlash}>
            <Text style={s.iconText}>Flash: {flashMode === 'off' ? '❌' : '⚡'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.captureBtn} onPress={takePhoto} />
          <TouchableOpacity style={s.iconBtn} onPress={toggleFacing}>
            <Text style={s.iconText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
      {error ? (
        <View style={s.errorContainer}>
          <Text style={s.error}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#000' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  camera:           { flex: 1, justifyContent: 'flex-end' },
  controls:         { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 40, paddingHorizontal: 20 },
  captureBtn:       { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(0,0,0,0.2)' },
  iconBtn:          { padding: 15, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30 },
  iconText:         { fontSize: 18, color: '#fff' },
  text:             { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  btn:              { padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnText:          { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  btnTextLg:        { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  btnGray:          { backgroundColor: '#333', flex: 1 },
  btnRed:           { backgroundColor: '#FF3B30', flex: 1 },
  btnBlue:          { backgroundColor: '#007AFF', padding: 18, borderRadius: 12 },
  preview:          { flex: 1, width: '100%' },
  previewControls:  { position: 'absolute', bottom: 30, left: 20, right: 20, gap: 15 },
  row:              { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  processingText:   { color: '#00FF00', marginTop: 15, fontSize: 16, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  errorContainer:   { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: 'rgba(255,0,0,0.7)', padding: 10, borderRadius: 8 },
  error:            { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});