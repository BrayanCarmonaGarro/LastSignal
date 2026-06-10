// src/app/auth.tsx
import { useEffect } from 'react';
import { useURL } from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

export default function AuthCallback() {
  const url = useURL();

  useEffect(() => {
    if (url) {
      WebBrowser.maybeCompleteAuthSession();
    }
  }, [url]);

  return null;
}