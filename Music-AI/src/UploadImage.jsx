import React, { useState } from "react";
import axios from "axios";

const UploadImage = ({ onUploadSuccess }) => {
  const [image, setImage] = useState(null);
  const [ImageUrl, setImageUrl] = useState(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);


  const handleImageChange = (e) => {
    const file = e.target.files[0];  // Use e.target.files[0] directly
    setImage(file);                  // Set the image state
    setImageUrl(URL.createObjectURL(file)); // Create the object URL for preview
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      alert("Please select an image first!");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);

    setLoading(true); 

    try {
      const res = await axios.post("http://127.0.0.1:5000/upload_image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResponse(res.data.message || "Image processed successfully!");

      if (onUploadSuccess) onUploadSuccess(); 
    } catch (error) {
      setResponse("Error uploading image: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div>
      <h1>Upload an Image</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
       
        <button type="submit" disabled={loading}>Upload</button>

      </form>
      {ImageUrl && <img src={ImageUrl} alt="Preview" style={{ width: '200px', marginTop: '20px' }} />}

      {loading && <p>Processing...</p>}
      {response && <p>{response}</p>} 
    </div>
  );
};

export default UploadImage;
