'use client'; // This is important for client-side components in the App Router

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createWorker } from 'tesseract.js';

export default function Home() {
  // State for image preview URL
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // State for extracted text result
  const [extractedText, setExtractedText] = useState<string>('');
  // State for OCR progress percentage
  const [progress, setProgress] = useState<number>(0);
  // State for detailed progress label (e.g., "Loading core", "Recognizing text")
  const [progressLabel, setProgressLabel] = useState<string>('Idle');
  // State for overall loading status (to disable button, show spinner)
  const [loading, setLoading] = useState<boolean>(false);
  // State for error messages
  const [error, setError] = useState<string>('');

  // useRef to hold the actual File object selected by the user.
  // This is crucial because tesseract.js needs the File object, not just its URL.
  const imageFileRef = useRef<File | null>(null);

  /**
   * Handles the change event when a user selects a file via the input.
   * Creates a preview URL for display and stores the actual File object.
   * @param event The change event from the file input.
   */
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      imageFileRef.current = file; // Store the actual File object
      setSelectedImage(URL.createObjectURL(file)); // Create URL for image preview
      
      // Reset previous states when a new image is selected
      setExtractedText('');
      setProgress(0);
      setProgressLabel('Idle');
      setError('');
    }
  };

  /**
   * Initiates the OCR process using Tesseract.js on the selected image.
   * Handles loading states, progress updates, and error reporting.
   */
  const processImage = async () => {
    if (!imageFileRef.current) {
      setError('Please select an image first to start conversion.');
      return;
    }

    setLoading(true); // Indicate that processing has started
    setExtractedText(''); // Clear any previous results
    setProgress(0); // Reset progress
    setProgressLabel('Loading Tesseract core...'); // Initial status message
    setError(''); // Clear previous errors

    try {
      // Create a Tesseract.js worker.
      // 'eng' specifies the English language for OCR.
      // The logger function provides real-time updates on the OCR process.
      const worker = await createWorker('eng', 1, {
        logger: m => {
          console.log(m); // Log all Tesseract.js messages for debugging

          if (m.status === 'recognizing text') {
            // Update progress percentage during text recognition
            setProgress(Math.round(m.progress * 100));
            setProgressLabel(`Recognizing text: ${Math.round(m.progress * 100)}%`);
          } else if (m.status === 'loading tesseract core') {
            setProgressLabel('Loading Tesseract core...');
          } else if (m.status === 'initializing tesseract') {
            setProgressLabel('Initializing Tesseract...');
          } else if (m.status === 'loading language traineddata') {
            setProgressLabel('Loading language data...');
          } else if (m.status === 'done') { // Tesseract.js reports 'done' at the very end
            setProgressLabel('Finishing up...');
          }
        },
      });

      // Perform OCR on the actual image file.
      const { data: { text } } = await worker.recognize(imageFileRef.current);
      
      setExtractedText(text); // Set the extracted text
      setProgress(100); // Set progress to 100%
      setProgressLabel('Done!'); // Final status message

      // Crucially important: terminate the worker to free up resources.
      // Failing to do so can lead to memory leaks and performance issues.
      await worker.terminate(); 

    } catch (err: unknown) { // Corrected: Using 'unknown' and type guarding
      console.error('OCR Error:', err); // Log the full error for debugging

      // Safely access the error message
      if (err instanceof Error) {
        setError(`Failed to extract text: ${err.message}`);
      } else {
        // Fallback for non-Error type errors (e.g., strings, numbers, plain objects)
        setError('Failed to extract text: An unexpected error occurred.');
      }
      setExtractedText(''); // Clear any partially extracted text on error
      setProgress(0); // Reset progress on error
      setProgressLabel('Error'); // Show error status
    } finally {
      setLoading(false); // Always stop loading, regardless of success or failure
    }
  };

  /**
   * useEffect hook for cleanup: revoking the object URL when the component unmounts
   * or when a new image is selected (and thus a new URL is created).
   * This prevents memory leaks.
   */
  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]); // Dependency array: run cleanup when selectedImage changes

  // Main JSX structure for the page
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-8 text-center leading-tight">
        Image to Text Converter
      </h1>

      <div className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200">
        <div className="mb-8">
          <label htmlFor="image-upload" className="block text-lg font-semibold text-gray-700 mb-3 cursor-pointer">
            <div className="flex items-center justify-center w-full px-5 py-3 border-2 border-dashed border-blue-400 rounded-lg text-blue-700 hover:bg-blue-50 transition duration-200 ease-in-out">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
              Click to Upload Image or Drag & Drop
            </div>
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*" // Accept all image types
            onChange={handleImageChange}
            className="hidden" // Hide the default input button
          />
        </div>

        {selectedImage && (
          <div className="mb-8 flex justify-center items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Image
              src={selectedImage}
              alt="Selected Preview"
              width={400} // Set appropriate width
              height={400} // Set appropriate height
              objectFit="contain" // Ensures the image fits within the bounds without cropping
              className="max-h-96 w-auto rounded-md shadow-inner"
            />
          </div>
        )}

        <button
          onClick={processImage}
          // Disable button if no image is selected or if loading
          disabled={!imageFileRef.current || loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 px-6 rounded-lg font-bold text-xl
                     hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition duration-300 ease-in-out
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-600"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {progressLabel} {progress > 0 && progress < 100 ? `(${progress}%)` : ''}
            </div>
          ) : 'Convert Image to Text'}
        </button>

        {error && (
          <p className="mt-6 text-red-600 bg-red-50 p-4 rounded-md border border-red-200 text-center text-md font-medium animate-fade-in">
            {error}
          </p>
        )}

        {extractedText && (
          <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-inner animate-fade-in">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Extracted Text:</h2>
            <textarea
              readOnly
              value={extractedText}
              className="w-full h-64 p-4 text-gray-800 bg-white border border-gray-300 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm leading-relaxed"
              placeholder="Extracted text will appear here..."
            />
             <button
              onClick={() => {
                navigator.clipboard.writeText(extractedText)
                  .then(() => alert('Text copied to clipboard!'))
                  .catch(err => console.error('Failed to copy text: ', err));
              }}
              className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md font-semibold text-md
                         hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Copy Text
            </button>
          </div>
        )}
      </div>
    </div>
  );
}