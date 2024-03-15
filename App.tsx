/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import Icon from 'react-native-vector-icons/FontAwesome';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Button,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const iconSize = screenWidth * 0.5;
const AnimatedIcon = Animated.createAnimatedComponent(Icon);

NfcManager.start();

function App(): React.JSX.Element {

  const [inputValue, setInputValue] = useState('');
  const [cardValue, setCardValue] = useState('');
  const [spinAnim, setSpinAnim] = useState(new Animated.Value(0));
  const [isScanning, setIsScanning] = useState(false);


  useEffect(() => {
    if (!isScanning) {
      Animated.loop(
        Animated.timing(
          spinAnim,
          {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }
        ),
        { iterations: -1 }
      ).start();
    }
  }, [isScanning]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  async function readNFC() {
    try {
      setIsScanning(true);
      await NfcManager.requestTechnology(NfcTech.NfcA, {
        alertMessage: 'Ready to scan',
      });

      let data: any[] = [];
      for (let i = 4; i <= 134; i += 4) {
        const commandRead = [0x30, i];
        const responseRead = await NfcManager.transceive(commandRead);
        data = data.concat(responseRead);
      }

      const asciiValues = data.map(value => String.fromCharCode(value));
      console.log(asciiValues.join(''));
      setCardValue(asciiValues.join(''));

    } catch (ex) {
      console.warn('Oops!', ex);
    } finally {
      setIsScanning(false);
      NfcManager.cancelTechnologyRequest();
    }
  }

  async function readProtectedNFC() {
    try {
      setIsScanning(true);
      await NfcManager.requestTechnology(NfcTech.NfcA, {
        alertMessage: 'Ready to scan',
      });

      console.log('auth card');
      const commandPassword = [0x1B, 0x02, 0x01, 0x01, 0x00]
      const response = await NfcManager.transceive(commandPassword);
      console.log(response.map(value => String.fromCharCode(value)));

      let data: any[] = [];
      for (let i = 4; i <= 134; i += 4) {
        const commandRead = [0x30, i];
        const responseRead = await NfcManager.transceive(commandRead);
        data = data.concat(responseRead);
      }

      const asciiValues = data.map(value => String.fromCharCode(value));
      console.log(asciiValues.join(''));
      setCardValue(asciiValues.join(''));

    } catch (ex) {
      console.warn('Oops!', ex);
    } finally {
      setIsScanning(false);
      NfcManager.cancelTechnologyRequest();
    }
  }

  async function writeNFC() {
    try {
      setIsScanning(true);
      await NfcManager.requestTechnology(NfcTech.NfcA, {
        alertMessage: 'Ready to scan',
      });

      const data = [...inputValue].map(c => c.charCodeAt(0));
      const paddingLength = (4 - (data.length % 4)) % 4;
      const paddedData = data.concat(new Array(paddingLength).fill(0));

      console.log('Writing to NFC tag', paddedData);
      for (let i = 0; i < paddedData.length; i += 4) {
        const commandWrite = [0xA2, 4 + i / 4, ...paddedData.slice(i, i + 4)];
        await NfcManager.transceive(commandWrite);
      }
    } catch (ex) {
      console.warn('Oops!', ex);
    } finally {
      setIsScanning(false);
      NfcManager.cancelTechnologyRequest();
    }
  }

  async function writeProtectedNFC() {
    try {
      setIsScanning(true);
      await NfcManager.requestTechnology(NfcTech.NfcA, {
        alertMessage: 'Ready to scan',
      });

      const data = [...inputValue].map(c => c.charCodeAt(0));
      const paddingLength = (4 - (data.length % 4)) % 4;
      const paddedData = data.concat(new Array(paddingLength).fill(0));

      console.log('auth card');
      const commandPassword = [0x1B, 0x02, 0x01, 0x01, 0x00]
      const response = await NfcManager.transceive(commandPassword);
      console.log(response.map(value => String.fromCharCode(value)));

      console.log('Writing to NFC tag', paddedData);
      for (let i = 0; i < paddedData.length; i += 4) {
        const commandWrite = [0xA2, 4 + i / 4, ...paddedData.slice(i, i + 4)];
        await NfcManager.transceive(commandWrite);
      }

    } catch (ex) {
      console.warn('Oops!', ex);
    } finally {
      setIsScanning(false);
      NfcManager.cancelTechnologyRequest();
    }
  }


  async function protectNFC() {

    try {
      setIsScanning(true);
      await NfcManager.requestTechnology(NfcTech.NfcA, {
        alertMessage: 'Ready to scan',
      });

      console.log('Setting password');
      const commandPassword = [0xA2, 0x85, 0x02, 0x01, 0x01, 0x00]
      await NfcManager.transceive(commandPassword);

      console.log('Setting pack');
      const passwordAcknowledge = ['F', 'i'].map(c => c.charCodeAt(0));
      const commandPasswordAcknowledge = [0xA2, 0x86, ...passwordAcknowledge, 0x00, 0x00]
      await NfcManager.transceive(commandPasswordAcknowledge);

      console.log('Protect write block');
      const commandRangeToBlock = [0xA2, 0x83, 0x04, 0x00, 0x00, 0x04]
      await NfcManager.transceive(commandRangeToBlock);

      console.log('Enable protection');
      const commandEnableProtection = [0xA2, 0x84, 0x80, 0x00, 0x00, 0x00]
      await NfcManager.transceive(commandEnableProtection);

    } catch (ex) {
      console.warn('Oops!', ex);
    } finally {
      setIsScanning(false);
      NfcManager.cancelTechnologyRequest();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} backgroundColor={'rgb(227, 0, 116)'} />
      <View style={styles.fillScreen}>
        {isScanning ? (
          <AnimatedIcon
            name="credit-card"
            size={iconSize}
            color='rgb(227, 0, 116)'
            style={{ transform: [{ rotate: spin }] }}
          />
        ) : (
          <Icon name="credit-card" size={iconSize} color="gray" />
        )}
        <Text style={{ color: 'gray', textAlign: 'center', fontSize: 36 }}>{cardValue}</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.padding}>
          <TextInput
            value={inputValue}
            onChangeText={text => setInputValue(text)}
            placeholder="Enter text"
            placeholderTextColor="gray"
            style={styles.input}
          />
        </View>
        <View style={[styles.padding, styles.pinkBackground]}>
          <Button title="Read Protected Card" onPress={readProtectedNFC} />
          <Button title="Write Protected Card" onPress={writeProtectedNFC} />
        </View>
        <View style={[styles.margin, styles.padding]}>
          <Button title="Read Card" onPress={readNFC} />
          <Button title="Write Card" onPress={writeNFC} />
        </View>
        <View style={[styles.margin, styles.padding]}>
          <Button title="Protect Card" onPress={protectNFC} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fillScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottom: {
    marginBottom: 20,
  },
  padding: {
    padding: 20,
  },
  margin: {
    marginTop: 20,
  },
  pinkBackground: {
    backgroundColor: 'rgb(227, 0, 116)',
  },
  horizontalBar: {
    height: 1,
    backgroundColor: 'gray',
  },
  input: {
    fontSize: 20,
    height: 40,
    color: 'black',
    padding: 10,
    backgroundColor: 'white',
    textAlignVertical: 'center'
  },
});

export default App;
