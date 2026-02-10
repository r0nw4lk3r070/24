import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { Emoji } from '../types'; // Assuming you have an Emoji type defined in your types

const emojis: Emoji[] = [
  { id: '1', symbol: '😀' },
  { id: '2', symbol: '😂' },
  { id: '3', symbol: '😍' },
  { id: '4', symbol: '😎' },
  { id: '5', symbol: '😢' },
  // Add more emojis as needed
];

interface EmojiPickerProps {
  onSelect: (emoji: Emoji) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  const [selectedEmoji, setSelectedEmoji] = useState<Emoji | null>(null);

  const handleEmojiSelect = (emoji: Emoji) => {
    setSelectedEmoji(emoji);
    onSelect(emoji);
  };

  return (
    <View>
      <FlatList
        data={emojis}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleEmojiSelect(item)}>
            <Text style={{ fontSize: 24 }}>{item.symbol}</Text>
          </TouchableOpacity>
        )}
        horizontal
      />
    </View>
  );
};

export default EmojiPicker;