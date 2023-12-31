import React, { useState } from 'react';
import { Button, Container, Row, Col, Form, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [textToEmbed, setTextToEmbed] = useState<string>('');
  const [decodedStrings, setDecodedStrings] = useState<string[]>([]);
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};
  

  // Initialize Firebase and Storage
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextToEmbed(e.target.value);
  };

  const handleImageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fileInput = e.currentTarget.querySelector('[type="file"]') as HTMLInputElement;

    if (fileInput?.files?.length) {
      const file = fileInput.files[0];

      const encodeDecode = async () => {

        try {
          const storageRef = ref(storage, 'images/' + file.name);
          const uploadTask = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(uploadTask.ref);
          console.log('File available at', downloadURL);

          if (mode === 'encode') {

            const requestData = {
              imgRef: storageRef,
              text: textToEmbed,
            };
  
            const ENDPOINT = "https://modify-and-store-image-rexemydxsa-uc.a.run.app";
            const response = await axios.post(ENDPOINT, requestData, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
            console.log(response.data);
          } else if (mode === 'decode') {
            const requestData = {
              imgRef: storageRef
            };
            const ENDPOINT = "https://get-strings-from-modified-img-rexemydxsa-uc.a.run.app";
            const response = await axios.post(ENDPOINT, requestData, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
            console.log(response.data.strings)
            setDecodedStrings(response.data.strings);
          }
          setImageSrc(downloadURL);
        } catch (error: any) {
          console.error('Error sending data to Firebase function:', error.message);
        }
      };

      encodeDecode();
    }
  };

  const handleDownloadClick = async () => {
    if (imageSrc) {
      // Create a virtual anchor element
      const link = document.createElement('a');
      link.href = imageSrc;
      link.target = '_blank';  // Open in a new tab
      link.download = 'image.jpg';  // This is still required for some browsers
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleModeChange = (value: 'encode' | 'decode') => {
    setMode(value);
    setDecodedStrings([]);
    setImageSrc(null);
    setTextToEmbed('');
    const fileInput = document.getElementById('formImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };


  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Form onSubmit={handleImageSubmit}>
            <Form.Group controlId="formMode">
              <ToggleButtonGroup className='mb-2' type="radio" name="mode" value={mode} onChange={handleModeChange}>
                <ToggleButton value="encode" id="encode">Encode</ToggleButton>
                <ToggleButton value="decode" id="decode">Decode</ToggleButton>
              </ToggleButtonGroup>
            </Form.Group>
            <Form.Group controlId="formImage">
              <Form.Label>{mode === 'encode' ? 'Image to Encode' : 'Image to Decode'}</Form.Label>
              <Form.Control type="file" accept="image/*" />
            </Form.Group>
            {mode === 'encode' && (
              <Form.Group controlId="embedText" className="mt-3">
                <Form.Label>Text to Embed</Form.Label>
                <Form.Control type="text" value={textToEmbed} onChange={handleTextChange}/>
              </Form.Group>
            )}
            <Button variant="primary" type="submit" className='mt-3'>
              {mode === 'encode' ? 'Encode Image' : 'Decode Image'}
            </Button>
          </Form>
          {imageSrc && mode === 'encode' && (
            <div className="mt-4">
              <Col>
                <h5>Encoded Image:</h5>
                <img src={imageSrc} alt="Updated" className="img-fluid" />
              </Col>
                <Button variant="success" onClick={handleDownloadClick} className='mt-3'>
                  Download Image
                </Button>
            </div>
          )}
          {mode === 'decode' && imageSrc && (
            <div className="mt-4">
              <Col>
                <h5>Decoded Strings:</h5>
                <ul>
                  {decodedStrings.map((decodedString, index) => (
                    <li key={index}>{decodedString}</li>
                  ))}
                </ul>
                <img src={imageSrc} alt="Updated" className="img-fluid" />
              </Col>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default App;
