import React, { useState } from 'react';
import { Button, Container, Row, Col, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [textToEmbed, setTextToEmbed] = useState<string>('');

  const handleImageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fileInput = e.currentTarget.querySelector('[type="file"]') as HTMLInputElement;

    if (fileInput?.files?.length) {
      const file = fileInput.files[0];
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        const binaryData = event.target?.result as ArrayBuffer;

        try {
          // Convert ArrayBuffer to Uint8Array for Axios
          const uint8Array = new Uint8Array(binaryData);
          const numberArray: number[] = Array.from(uint8Array);
          const base64EncodedData: string = btoa(String.fromCharCode.apply(null, numberArray));


          // Create a JSON object with the encoded binary data and text
          const requestData = {
            image: base64EncodedData,
            text: textToEmbed,
          };

          // Make a POST request to the Firebase Function endpoint
          const ENDPOINT = "https://embed-text-endpoint-rexemydxsa-uc.a.run.app";
          const response = await axios.post(ENDPOINT, requestData, {
            headers: {
              'Content-Type': 'application/json',
            },
          });


          // Set the updated image source
          const newbase64EncodedData = response.data.modifiedImageData
          console.log(newbase64EncodedData)
          // Decode the Base64-encoded image data
          const decodedImageData = atob(newbase64EncodedData);
      
          // Convert the decoded data to a Uint8Array
          const newuint8Array = new Uint8Array(decodedImageData.length);
          for (let i = 0; i < decodedImageData.length; ++i) {
            uint8Array[i] = decodedImageData.charCodeAt(i);
          }
      
          // Create a Blob from the Uint8Array
          const blob = new Blob([newuint8Array], { type: 'image/jpeg' });
      
          // Create a data URL from the Blob
          const imageUrl = URL.createObjectURL(blob);
      
          // Update the image source in the state
          // setImageSrc(imageUrl);
          setImageSrc(`data:image/jpeg;base64,${response.data.modifiedImageData}`);
        } catch (error) {
          console.error('Error sending data to Firebase function:', error);
        }
      };

      fileReader.readAsArrayBuffer(file);
    }
  };

  const handleDownloadClick = () => {
    if (imageSrc) {
      // Create a virtual anchor element
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = 'image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Form onSubmit={handleImageSubmit}>
            <Form.Group controlId="formImage">
              <Form.Label>Submit Image</Form.Label>
              <Form.Control type="file" accept="image/*" />
            </Form.Group>
            <Form.Group controlId="embedText" className='mt-3'>
              <Form.Label>Hidden Text to Add</Form.Label>
              <Form.Control type="text" value={textToEmbed} onChange={(e) => setTextToEmbed(e.target.value)} />
            </Form.Group>
            <Button variant="primary" type="submit" className='mt-3'>
              Encode Image
            </Button>
          </Form>

          {imageSrc && (
            <div className="mt-4">
              <h5>Encoded Image:</h5>
              <img src={imageSrc} alt="Updated" className="img-fluid" />
              <Button variant="success" onClick={handleDownloadClick} className='mt-3'>
                Download Image
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default App;
