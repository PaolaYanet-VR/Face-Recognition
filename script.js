//const imageUpload = document.getElementById('imageUpload')
const video = document.getElementById('video')
const nombre = document.getElementById('nombre')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(startVideo)//start

//

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

video.addEventListener('play', async () => {

  // Crea el canvas sobre el video
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)

  // tamaño de la camara
  const displaySize = { width: video.width, height: video.height }

  // hace un match entre el canva y el video para que cuadre
  faceapi.matchDimensions(canvas, displaySize)

  // llama la cosa que pone los nombres
  const labeledFaceDescriptors = await loadLabeledImages()

  // Matcher para la cara con las etiquetas para ver si encuentra algo
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)

  // 
  setInterval(async () => {

    // Variable de las cajas de detección de caras
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors()
    //const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()

    // escala las detecciones para que concuerden con la imagen
    const resizedDetections = faceapi.resizeResults(detections, displaySize)

    // Variable donde almacena la cara detectada con el nombre
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))

    //limpia el canvas antes de poner la deteción
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

    // forEach de los resultados que encontró en la foto dibujando cada caja con su nombre
    results.forEach((result, i) => {
      // caja
      const box = resizedDetections[i].detection.box
      // dibujo de caja que concuerde con la detección
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.label.toString() })
      nombre.innerText = "The face is " + result.label.toString()

      // lo pinta
      drawBox.draw(canvas)
    })

  }, 100)

})


function loadLabeledImages() {

  // personas
  const labels = ['Aimep3', 'Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Ivan', 'Jim Rhodes', 'Paco', 'Pola', 'Poncho', 'Thor', 'Tony Stark', 'Yare']
  
  // relaciona los labels con las personas que están en labeled_images
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        // consulta en las carpetas para ver las caras que ya conoce
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/PaolaYanet-VR/Face-Recognition/master/labeled_images/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      // returns who is who
      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
