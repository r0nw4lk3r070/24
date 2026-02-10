import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Contact {
  id: string;
  username: string;
  fcmToken?: string;
  addedAt: Date;
}

const CONTACTS_STORAGE_KEY = '@Nalid24:Contacts';

// Get all contacts
export const getContacts = async (): Promise<Contact[]> => {
  try {
    const contactsData = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
    if (!contactsData) return [];
    
    const contacts: Contact[] = JSON.parse(contactsData);
    return contacts.map(contact => ({
      ...contact,
      addedAt: new Date(contact.addedAt)
    }));
  } catch (error) {
    console.error('Error getting contacts:', error);
    return [];
  }
};

// Add a new contact
export const addContact = async (id: string, username: string, fcmToken?: string): Promise<Contact> => {
  try {
    const contacts = await getContacts();
    
    // Check if contact already exists
    const existingContact = contacts.find(c => c.id === id);
    if (existingContact) {
      // Update FCM token if provided
      if (fcmToken && existingContact.fcmToken !== fcmToken) {
        existingContact.fcmToken = fcmToken;
        await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
      }
      return existingContact;
    }
    
    const newContact: Contact = {
      id,
      username,
      fcmToken,
      addedAt: new Date()
    };
    
    contacts.push(newContact);
    await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
    
    return newContact;
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
};

// Remove a contact
export const removeContact = async (id: string): Promise<void> => {
  try {
    const contacts = await getContacts();
    const filteredContacts = contacts.filter(c => c.id !== id);
    await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(filteredContacts));
  } catch (error) {
    console.error('Error removing contact:', error);
    throw error;
  }
};

// Get a specific contact
export const getContact = async (id: string): Promise<Contact | null> => {
  try {
    const contacts = await getContacts();
    return contacts.find(c => c.id === id) || null;
  } catch (error) {
    console.error('Error getting contact:', error);
    return null;
  }
};

// Clear all contacts
export const clearAllContacts = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CONTACTS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing contacts:', error);
    throw error;
  }
};
