import { Image, StyleSheet, Text, TouchableOpacity, View, Button, Alert } from "react-native";
import React, { useState, useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import axios from 'axios';

import { CartContext } from "../context/CartContext";
const productData = require('../data/data.json');

const Header = ({ isCart }) => {
  const navigation = useNavigation();
  const { addToCartItem } = useContext(CartContext);

  const audioRecorderPlayer = new AudioRecorderPlayer();
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  const ASSEMBLYAI_API_KEY = 'd07c08f62d0446e78cf61acf5eb829c7';
  const products = productData.products;
  const filePath = 'file:////data/user/0/com.test/cache/sound.mp4';

  const handleBack = () => {
    navigation.navigate("HOME");
  };

  const startRecording = async () => {
    setIsRecording(true);
    try {
      const result = await audioRecorderPlayer.startRecorder(null, {
        format: 'mp4',
      });
      console.log('Recording started:', result);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      console.log('Recording stopped:', result);
      await transcribeAudio(filePath);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const transcribeAudio = async (filePath) => {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: filePath,
        name: 'sound.mp4',
        type: 'audio/mp4',
      });

      const uploadRes = await axios.post('https://api.assemblyai.com/v2/upload', formData, {
        headers: {
          authorization: ASSEMBLYAI_API_KEY,
          'content-type': 'multipart/form-data',
        },
      });

      const transcriptData = {
        audio_url: uploadRes.data.upload_url,
      };

      const response = await axios.post('https://api.assemblyai.com/v2/transcript', transcriptData, {
        headers: {
          authorization: ASSEMBLYAI_API_KEY,
          'content-type': 'application/json',
        },
      });

      const transcriptId = response.data.id;

      const checkStatus = async () => {
        const result = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: {
            authorization: ASSEMBLYAI_API_KEY,
          },
        });

        if (result.data.status === 'completed') {
          setVoiceText(result.data.text);
          handleCommand(result.data.text.toLowerCase());
        } else {
          setTimeout(checkStatus, 1000);
        }
      };
      checkStatus();
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
    }
  };

  const handleCommand = (command) => {
    if (command.includes('add')) {
      const productName = command.split('add ')[1]?.split(' to the cart')[0]?.trim().toLowerCase();
      if (productName) {
        addProductToCart(productName);
      }
    }
  };

  const addProductToCart = (productName) => {
    const product = products.find((p) => p.title.toLowerCase().includes(productName));

    if (product) {
      addToCartItem(product);
      Alert.alert('Added to Cart', `${product.title} has been added to your cart.`);
    } else {
      Alert.alert('Product not found', `We couldn't find a product called "${productName}".`);
    }
  };

  return (
    <View style={styles.header}>
      {isCart ? (
        <TouchableOpacity
          style={styles.appDrawerContainer}
          onPress={handleBack}
        >
          <Image
            source={require("../assets/arrowback.png")}
            style={styles.appBackIcon}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.appDrawerContainer}>
          <Image
            source={require("../assets/apps.png")}
            style={styles.appDrawerIcon}
          />
        </View>
      )}

      {isCart ? <Text style={styles.titleText}>My Cart</Text> : null}

      <View>
        <Image
          source={require("../assets/Ellipse2.jpg")}
          style={styles.profileImage}
        />
      </View>

      <Button
        title={isRecording ? "Stop Recording" : "Start Voice Command"}
        onPress={isRecording ? stopRecording : startRecording}
      />

      {voiceText ? <Text>Command: {voiceText}</Text> : null}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  appDrawerContainer: {
    backgroundColor: "white",
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  appDrawerIcon: {
    height: 30,
    width: 30,
  },
  appBackIcon: {
    height: 24,
    width: 24,
    marginLeft: 10,
  },
  profileImage: {
    height: 44,
    width: 44,
    borderRadius: 22,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleText: {
    fontSize: 28,
    color: "#000000",
  },
});
