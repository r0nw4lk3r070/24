import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { useMessages } from '../hooks/useMessages';
import { Message } from '../types';

const GroupChatScreen = () => {
  const { messages, sendMessage } = useMessages();
  const [inputMessage, setInputMessage] = useState('');

  const handleSend = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  useEffect(() => {
    // Logic to handle cleanup of messages older than 24 hours can be added here
  }, []);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={messages}
        renderItem={({ item }: { item: Message }) => (
          <View>
            <Text>{item.senderId}: {item.content}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
      <TextInput
        value={inputMessage}
        onChangeText={setInputMessage}
        placeholder="Type your message..."
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 }}
      />
      <Button title="Send" onPress={handleSend} />
    </View>
  );
};

export default GroupChatScreen;