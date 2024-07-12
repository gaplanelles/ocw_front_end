import React, { useRef, useState } from 'react';
import racingLogo from './racing_logo.svg';
import strip from './strip_img.png';
import './App.css';
import backgroundDesign from './background_design.png';
import AvatarImg from './Avatar4a.png';

function App() {
  const videoRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [showImage, setShowImage] = useState(true);
  const [apiText, setApiText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApiResponseReceived, setIsApiResponseReceived] = useState(false);
  const [isImagePending, setIsImagePending] = useState(false);
  const [capturedImageDataURL, setCapturedImageDataURL] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stateName, setStateName] = useState('F1 Pilot');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');

  console.log(capturedImageDataURL);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowImage(false);
        setIsCameraOn(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setShowImage(true);
      setIsCameraOn(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageDataURL = canvas.toDataURL('image/png').split(',')[1];
      console.log('Captured Image:', imageDataURL);
      setCapturedImageDataURL(imageDataURL);
      setIsLoading(true);
      setIsApiResponseReceived(true);
      fetchApiText(imageDataURL);
    }
  };

  const fetchApiText = (imageDataURL) => {
    const url = `https://193.123.68.104:5001/generateText?StateName=${stateName}&firstname=${firstname}&lastname=${lastname}&email=${email}`;

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(async response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      let botResponse = '';
      let data = await response.text();

      var jsonObjects = [];
      var start = 0;
      for (var i = 0; i < data.length; i++) {
        console.log(data);
        if (data[i] === '{') {
          start = i;
        } else if (data[i] === '}') {
          var jsonObject = data.substring(start, i + 1);
          jsonObjects.push(JSON.parse(jsonObject));
        }
      }

      jsonObjects.forEach(obj => {
        const data = obj;
        if (data.response === "\n") {
          data.response = "<br>";
        }
        botResponse = botResponse + data.response;
        console.log(botResponse);
      });

      setApiText(botResponse);
      setIsImagePending(true);
      setIsLoading(false);
      callCreateImageAPI(imageDataURL);
    })
    .catch(error => {
      console.error('Error fetching API:', error);
      setIsLoading(false);
    });
  };

  const callCreateImageAPI = (imageDataURL) => {
    const url = `https://193.123.68.104:5000/createImage`;

    const requestBody = {
      image: imageDataURL,
      StateName: stateName
    };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
    .then(async response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const responseData = await response.json();
      setImageUrl(responseData.URL);
      setIsImagePending(false);
      setIsLoading(false);
    })
    .catch(error => {
      console.error('Error calling createImage API:', error);
      setIsLoading(false);
    });
  };

  const handleCloseModal = () => {
    setIsApiResponseReceived(false);
    window.location.reload();
  }

  return (
    <div className="App" style={{ backgroundImage: `url(${backgroundDesign})` }}>
      <header className="App-header">
        <div className="top-strip strip-container">
          <img src={strip} alt="Imagen Superior" className="strip-image" />
        </div>
        <div className="top-container">
          <img src={racingLogo} alt="Racing Logo" />
        </div>

        <div className="bottom-container">
          <div className="video-container" style={{ border: '10px solid black', borderRadius: '10px', overflow: 'hidden', position:'relative' }}>
            <video ref={videoRef} width="240" height="320" autoPlay style={{ display: 'block' }}></video>
            {showImage && <img src={AvatarImg} alt="Avatar" className="superpuesta" />}
          </div>
          <p className="text-between-video-and-buttons">Tip: For best results, face the camera straight on and smile!</p>

          <div className="form-container">
            <select value={stateName} onChange={(e) => setStateName(e.target.value)}>
              <option value="F1Driver">F1 Driver</option>
              <option value="PitCrew">Pit Crew</option>
            </select>
            <input type="text" placeholder="First Name" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
            <input type="text" placeholder="Last Name" value={lastname} onChange={(e) => setLastname(e.target.value)} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="buttons-container">
            {isCameraOn ? (
              <button onClick={stopCamera} className="stop-camera">Stop Camera</button>
            ) : (
              <button onClick={startCamera} className="start-camera">Start Camera</button>
            )}
            <button onClick={captureImage} className="capture-image">Capture Image</button>
          </div>
          {isApiResponseReceived && isLoading && (
            <div className="modal-small modal-background">
              <div className="modalsmall-content">
                <div className="loader"></div>
              </div>
            </div>
          )}
          {isApiResponseReceived && !isLoading && (
            <div className="modal modal-background">
              <div className="modal-content">
                <span className="close" onClick={() => handleCloseModal()}>×</span>
                <img src={racingLogo} alt="Icono" className="centered-image" />
                <h2 className='press-release-title' style={{ color: "black" }}>Press Release</h2>

                {isImagePending ? (
                  <div>
                    <span className="loader"></span>
                    <h3 className="text-between-video-and-buttons" style={{ color: "#888", marginTop: "10px", marginBottom: "10px", fontSize: "12px" }}>
                      We are drawing something cool for you.
                    </h3>
                  </div>
                ) : (
                  <div>
                    <img src={imageUrl} alt="Captured" style={{ width: "400px", height: "400px", marginTop: "0px" }} />
                  </div>
                )}
                <div>
                  <p dangerouslySetInnerHTML={{ __html: apiText }} style={{ textAlign: "justify", margin: "0 20px" }}></p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="bottom-strip strip-container">
          <img src={strip} alt="Imagen Inferior" className="strip-image" />
        </div>
      </header>
    </div>
  );
}

export default App;
