import React, { useRef, useState, useEffect } from 'react';
import racingLogo from './racing_logo.svg';
import strip from './strip_img.png'
//import logo from './logo.svg';
import './App.css';
//import backgroundImage from './background.png'; // Importa la imagen de fondo local
import backgroundDesign from './background_design.png'; // Importa la imagen de fondo local
import AvatarImg from './Avatar4a.png'

function App() {
  const videoRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false); // Estado para controlar si la cámara está encendida o apagada
  const [showImage, setShowImage] = useState(true);
  const [apiText, setApiText] = useState(''); // Estado para almacenar el texto devuelto por la API
  const [isLoading, setIsLoading] = useState(false); // Estado para controlar la visibilidad del loader/spinner
  const [isApiResponseReceived, setIsApiResponseReceived] = useState(false); // Estado para controlar si se ha recibido la respuesta de la API
  const [isImagePending, setIsImagePending] = useState(false); // Estado para controlar si se ha recibido la respuesta de la API
  
  const [capturedImageDataURL, setCapturedImageDataURL] = useState(''); // Estado para almacenar la imagen capturada en base64
  const [imageUrl, setImageUrl] = useState(''); // Estado para almacenar la URL de la imagen devuelta por la API createImage
  const [urlParams, setUrlParams] = useState({}); // Estado para almacenar los parámetros de la URL

  console.log(capturedImageDataURL)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowImage(false)
        setIsCameraOn(true); // Actualiza el estado de la cámara
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
      setIsCameraOn(false); // Actualiza el estado de la cámara
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
      console.log('Captured Image:', imageDataURL)
      setCapturedImageDataURL(imageDataURL); // Almacena la imagen capturada en base64 en el estado
      setIsLoading(true); // Muestra el loader/spinner mientras se espera la respuesta de la API
      setIsApiResponseReceived(true);
      fetchApiText(imageDataURL); // Llama a la función para obtener el texto de la API
    }
  };

  const fetchApiText = (imageDataURL) => {
    const { requisitions, firstname, lastname, email } = urlParams;
    const url = `https://193.123.68.104:5001/generateText?requisitions=${requisitions}&firstname=${firstname}&lastname=${lastname}&email=${email}`;
  
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
        });

        setApiText(botResponse);
        //setIsApiResponseReceived(true);
        setIsImagePending(true)
        setIsLoading(false);
        callCreateImageAPI(imageDataURL); // Llama a la función para enviar la imagen a la API createImage
    })
    .catch(error => {
        console.error('Error fetching API:', error);
        setIsLoading(false);
    });
  };

  const callCreateImageAPI = (imageDataURL) => {
    const { requisitions } = urlParams;
    const url = `https://193.123.68.104:5000/createImage`;

    // Construir el cuerpo de la solicitud
    const requestBody = {
        image: imageDataURL,
        requisitions: requisitions
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody) // Convertir el objeto a JSON y enviarlo en el cuerpo de la solicitud
    })
    .then(async response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // Procesar la respuesta si es necesario
        const responseData = await response.json();
        setImageUrl(responseData.URL); // Actualizar el estado con la URL de la imagen devuelta por la API
        setIsImagePending(false)
        setIsLoading(false); // Oculta el loader/spinner una vez que se ha recibido la respuesta de la API createImage
    })
    .catch(error => {
        console.error('Error calling createImage API:', error);
        setIsLoading(false);
    });
  };

  const getUrlParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const params = {};
    for (let param of searchParams.entries()) {
      params[param[0]] = param[1];
    }
    setUrlParams(params);
    console.log('URL Params:', params);
  };

  useEffect(() => {
    getUrlParams();
  }, []);

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
          <video ref={videoRef} width="320" height="240" autoPlay style={{ display: 'block' }}></video>
          {showImage && <img src={AvatarImg} alt="Avatar" className="superpuesta" />}
        </div>
        <p className="text-between-video-and-buttons">Tip: For best results, face the camera straight on and smile!</p>
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
                <span className="close" onClick={() => setIsApiResponseReceived(false)}>×</span>
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