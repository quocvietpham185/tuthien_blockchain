import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CATEGORIES } from "../constants";
import { uploadImageToIPFS } from "../utils/ipfs";

export default function CreateCampaign({ contractHooks, account }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Giáo dục",
    goal: "",
    durationDays: 30,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [ipfsResult, setIpfsResult] = useState(null);
  const [step, setStep] = useState(1);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const setSelectedImage = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageChange = (event) => setSelectedImage(event.target.files[0]);

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) setSelectedImage(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) return toast.error("Vui lòng nhập tên chiến dịch");
    if (!form.description.trim()) return toast.error("Vui lòng nhập mô tả");
    if (!form.goal || parseFloat(form.goal) <= 0) return toast.error("Vui lòng nhập mục tiêu hợp lệ");
    if (!account) return toast.error("Vui lòng kết nối ví MetaMask trước");

    let ipfsHash = "";

    if (imageFile) {
      setStep(2);
      setUploading(true);
      try {
        const result = await uploadImageToIPFS(imageFile);
        ipfsHash = result.cid;
        setIpfsResult(result);
        toast.success("Hình ảnh đã được tải lên IPFS");
      } catch (error) {
        toast.error("Lỗi upload IPFS: " + error.message);
        setUploading(false);
        setStep(1);
        return;
      }
      setUploading(false);
    }

    setStep(3);
    setCreating(true);
    const result = await contractHooks.createCampaign({
      title: form.title,
      description: form.description,
      category: form.category,
      ipfsHash,
      goal: form.goal,
      durationDays: parseInt(form.durationDays, 10),
    });
    setCreating(false);

    if (result.success) {
      toast.success("Chiến dịch đã được tạo thành công trên blockchain");
      navigate("/");
    } else {
      setStep(1);
    }
  };

  if (!account) {
    return (
      <div className="page-content">
        <div className="container" style={{ paddingTop: 60 }}>
          <div className="card" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16, fontWeight: 800 }}>Ví</div>
            <h2 style={{ color: "#111827", marginBottom: 8 }}>Kết Nối Ví Để Tiếp Tục</h2>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>
              Bạn cần kết nối ví MetaMask để tạo chiến dịch từ thiện
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <h1 className="section-title" style={{ fontSize: 32, marginBottom: 8 }}>
            Tạo Chiến Dịch Mới
          </h1>
          <p className="section-subtitle" style={{ fontSize: 15 }}>
            Chiến dịch sẽ được lưu vĩnh viễn trên Ethereum Blockchain
          </p>
        </div>

        <div className="create-steps">
          {[
            { num: 1, label: "Thông tin" },
            { num: 2, label: "Upload IPFS" },
            { num: 3, label: "Blockchain" },
          ].map((item) => (
            <div key={item.num} className={`create-step ${step >= item.num ? "active" : ""} ${step > item.num ? "done" : ""}`}>
              <div className="step-circle">{step > item.num ? "OK" : item.num}</div>
              <span className="step-label">{item.label}</span>
              {item.num < 3 && <div className={`step-line ${step > item.num ? "done" : ""}`} />}
            </div>
          ))}
        </div>

        <div className="create-layout">
          <div className="card create-form">
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Hình ảnh chiến dịch (IPFS)</label>
                <div
                  className={`image-drop-zone ${imagePreview ? "has-image" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={(event) => event.preventDefault()}
                  onClick={() => document.getElementById("imageInput").click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                  ) : (
                    <div className="drop-placeholder">
                      <span style={{ fontSize: 18, fontWeight: 700 }}>Chọn ảnh</span>
                      <p>Kéo thả hoặc nhấn để chọn hình ảnh</p>
                      <span className="form-hint">PNG, JPG, GIF tối đa 10MB</span>
                      <span className="drop-ipfs-badge">Sẽ được lưu trên IPFS</span>
                    </div>
                  )}
                </div>
                <input id="imageInput" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                {imageFile && (
                  <p className="form-hint" style={{ color: "#047857" }}>
                    {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Tên chiến dịch *</label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  placeholder="VD: Xây trường học cho trẻ em vùng cao"
                  value={form.title}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />
                <span className="form-hint">{form.title.length}/100 ký tự</span>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả chiến dịch *</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="Mô tả mục đích, kế hoạch sử dụng tiền quyên góp..."
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  maxLength={1000}
                  required
                />
                <span className="form-hint">{form.description.length}/1000 ký tự</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Mục tiêu (ETH) *</label>
                  <input
                    type="number"
                    name="goal"
                    className="form-input"
                    placeholder="1.0"
                    value={form.goal}
                    onChange={handleChange}
                    min="0.001"
                    step="0.001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Thời hạn (ngày)</label>
                  <input
                    type="number"
                    name="durationDays"
                    className="form-input"
                    value={form.durationDays}
                    onChange={handleChange}
                    min="1"
                    max="365"
                  />
                  <span className="form-hint">1 - 365 ngày</span>
                </div>
              </div>

              {ipfsResult && (
                <div className="alert alert-success">
                  <div>
                    <strong>Đã upload lên IPFS</strong>
                    <br />
                    CID: <code style={{ fontSize: 11 }}>{ipfsResult.cid}</code>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={uploading || creating} style={{ marginTop: 8 }}>
                {uploading ? <><span className="spinner" /> Đang upload IPFS...</> : creating ? <><span className="spinner" /> Đang tạo trên blockchain...</> : "Tạo Chiến Dịch"}
              </button>
            </form>
          </div>

          <div className="create-preview">
            <div className="card">
              <h3 style={{ color: "#111827", marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Xem trước</h3>
              <div className="preview-image">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 18 }}>Chưa có ảnh</div>
                )}
              </div>
              <div style={{ marginTop: 16 }}>
                <h4 style={{ color: "#111827", fontWeight: 700 }}>{form.title || "Tên chiến dịch..."}</h4>
                <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>
                  {form.description.substring(0, 100) || "Mô tả chiến dịch..."}
                </p>
                {form.goal && (
                  <div style={{ marginTop: 12, color: "#111827", fontWeight: 800, fontSize: 18 }}>
                    Mục tiêu: {form.goal} ETH
                  </div>
                )}
                <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
                  Thời hạn: {form.durationDays} ngày
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ color: "#111827", marginBottom: 12, fontSize: 14, fontWeight: 700 }}>Quy trình</h3>
              <div className="process-steps">
                <div className="process-step">
                  <span className="process-step-num">1</span>
                  <div>
                    <strong>Upload hình ảnh lên IPFS</strong>
                    <p>File được lưu trên IPFS và trả về CID</p>
                  </div>
                </div>
                <div className="process-step">
                  <span className="process-step-num">2</span>
                  <div>
                    <strong>Smart Contract</strong>
                    <p>CID và thông tin được lưu on-chain</p>
                  </div>
                </div>
                <div className="process-step">
                  <span className="process-step-num">3</span>
                  <div>
                    <strong>MetaMask xác nhận</strong>
                    <p>Ký transaction bằng ví của bạn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
