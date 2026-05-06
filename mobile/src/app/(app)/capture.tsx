import React, { useMemo, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { makeStyles } from '@/styles/captureStyles';
import { StarField } from '@/components/ui/StarField';
import { useCamera } from '@/hooks/useCamera';
import { storageApi } from '@/services/api/storage.api';
import { aiApi, type AIResponse } from '@/services/api/ai.api';
import { logbookApi } from '@/services/api/logbook.api';
import { CLASSIFICATION_LABELS, DANGER_LABELS } from '@/constants/labels';

export default function CaptureScreen() {
  const router = useRouter();
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
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
  const [aiResult,         setAiResult]         = useState<AIResponse | null>(null);

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
  const clearAll     = () => { setAiResult(null); clearPhoto(); };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setLastPhoto({ uri: result.assets[0].uri });
      setError(null);
    }
  };

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
      await logbookApi.create({
        photo_url:      upload.url_acceso,
        description:    aiData.description    || 'Sin descripción',
        classification: aiData.classification || 'UNKNOWN_ORGANISM',
        danger_level:   aiData.danger_level   || 'UNKNOWN',
      });

      setAiResult(aiData);
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
        <ActivityIndicator size="large" color={theme.colors.oxygen} />
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
    if (aiResult) {
      return (
        <View style={s.container}>
          <Image source={{ uri: lastPhoto.uri }} style={s.preview} />
          <TouchableOpacity style={s.backBtn} onPress={() => setAiResult(null)}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={s.previewControls}>
            <StarField />
            <Text style={s.resultTitle}>¡Análisis completo!</Text>
            <Text style={s.resultDesc}>{aiResult.description}</Text>
            <View style={s.resultMetaRow}>
              {(() => {
                const cc = theme.classificationColors[aiResult.classification as keyof typeof theme.classificationColors] ?? theme.classificationColors.UNKNOWN_ORGANISM;
                const dc = theme.dangerColors[aiResult.danger_level as keyof typeof theme.dangerColors] ?? theme.dangerColors.UNKNOWN;
                const { fonts, spacing, radii } = theme;
                return (
                  <>
                    <View style={{ borderRadius: radii.full, borderWidth: 1, borderColor: `${cc.border}99`, backgroundColor: cc.bg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
                      <Text style={{ fontFamily: fonts.heading, fontSize: 11, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        {CLASSIFICATION_LABELS[aiResult.classification as keyof typeof CLASSIFICATION_LABELS] ?? aiResult.classification}
                      </Text>
                    </View>
                    <View style={{ borderRadius: radii.full, borderWidth: 1, borderColor: `${dc.border}99`, backgroundColor: dc.bg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
                      <Text style={{ fontFamily: fonts.heading, fontSize: 11, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        {DANGER_LABELS[aiResult.danger_level as keyof typeof DANGER_LABELS] ?? aiResult.danger_level}
                      </Text>
                    </View>
                  </>
                );
              })()}
            </View>
            <View style={s.row}>
              <TouchableOpacity style={[s.btn, s.btnGray]} onPress={clearAll}>
                <Text style={s.btnText}>Nueva Foto</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[s.btn, s.btnBlue]} onPress={() => router.push('/(app)/(tabs)/logbook')}>
              <Text style={s.btnTextLg}>Ver Bitácora</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={s.container}>
        <Image source={{ uri: lastPhoto.uri }} style={s.preview} />

        {isProcessing && (
          <View style={s.processingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={s.processingText}>{processingStatus}</Text>
          </View>
        )}

        {/* Back button */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={s.previewControls}>
          <StarField />
          <View style={s.row}>
            <TouchableOpacity style={[s.btn, s.btnGray]} onPress={() => saveToGallery(lastPhoto.uri)}>
              <Text style={s.btnText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.btnRed]} onPress={clearPhoto}>
              <Text style={s.btnTextNeutral}>Nueva Foto</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[s.btn, s.btnBlue]} onPress={handleCreateLogbook} disabled={isProcessing}>
            <Text style={s.btnTextLg}>Crear Logbook con IA</Text>
          </TouchableOpacity>
          {error ? <Text style={s.error}>{error}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Back button */}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Flash button top-right */}
      <TouchableOpacity style={s.flashBtn} onPress={toggleFlash}>
        <Ionicons name={flashMode === 'off' ? 'flash-off' : 'flash'} size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <CameraView ref={cameraRef} style={s.camera} facing={facing} flash={flashMode}>
        <View style={s.controls}>
          <TouchableOpacity style={s.iconBtn} onPress={pickFromGallery}>
            <Ionicons name="images-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={s.captureBtn} onPress={takePhoto} />
          <TouchableOpacity style={s.iconBtn} onPress={toggleFacing}>
            <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
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

