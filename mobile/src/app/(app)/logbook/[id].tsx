import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

export default function LogbookDetail() {
  const { id } = useLocalSearchParams()

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Logbook Entry: {id}</Text>
    </View>
  )
}