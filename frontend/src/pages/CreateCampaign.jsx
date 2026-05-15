import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadImageToIPFS } from "../utils/ipfs";
import { CATEGORIES } from "../constants";
import toast from "react-hot-toast";

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
  const [step, setStep] = useState(1); // 1: Form, 2: Upload IPFS, 3: Deploy

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!form.title.trim()) return toast.error("Vui lòng nhập tên chiến dịch");
    if (!form.description.trim()) return toast.error("Vui lòng nhập mô tả");
    if (!form.goal || parseFloat(form.goal) <= 0) return toast.error("Vui lòng nhập mục tiêu hợp lệ");
    if (!account) return toast.error("Vui lòng kết nối ví MetaMask trước");

    let ipfsHash = "";

    // Step 2: Upload to IPFS
    if (imageFile) {
      setStep(2);
      setUploading(true);
      try {
        const result = await uploadImageToIPFS(imageFile);
        ipfsHash = result.cid;
        setIpfsResult(result);
        toast.success("✅ Hình ảnh đã được tải lên IPFS!");
      } catch (err) {
        toast.error("Lỗi upload IPFS: " + err.message);
        setUploading(false);
        setStep(1);
        return;
      }
      setUploading(false);
    }

    // Step 3: Deploy to blockchain
    setStep(3);
    setCreating(true);
    const result = await contractHooks.createCampaign({
      title: form.title,
      description: form.description,
      category: form.category,
      ipfsHash,
      goal: form.goal,
      durationDays: parseInt(form.durationDays),
    });
    setCreating(false);

    if (result.success) {
      toast.success("🎉 Chiến dịch đã được tạo thành công trên blockchain!");
      navigate("/");
    } else {
      setStep(1);
    }
  };

  if (!account) {
    return (
      <div className="page-content">
        <div className="container" style={{ paddingTop: 60 }}>
          <div className="card" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🦊</div>
            <h2 style={{ color: "#f1f5f9", marginBottom: 8 }}>Kết Nối Ví Để Tiếp Tục</h2>
            <p style={{ color: "#64748b", marginBottom: 24 }}>
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
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <h1 className="section-title" style={{ fontSize: 32, marginBottom: 8 }}>
            🚀 Tạo Chiến Dịch Mới
          </h1>
          <p className="section-subtitle" style={{ fontSize: 15 }}>
            Chiến dịch sẽ được lưu vĩnh viễn trên Ethereum Blockchain
          </p>
        </div>

        {/* Progress Steps */}
        <div className="create-steps">
          {[
            { num: 1, label: "Thông tin" },
            { num: 2, label: "Upload IPFS" },
            { num: 3, label: "Blockchain" },
          ].map((s) => (
            <div key={s.num} className={`create-step ${step >= s.num ? "active" : ""} ${step > s.num ? "done" : ""}`}>
              <div className="step-circle">
                {step > s.num ? "✓" : s.num}
              </div>
              <span className="step-label">{s.label}</span>
              {s.num < 3 && <div className={`step-line ${step > s.num ? "done" : ""}`} />}
            </div>
          ))}
        </div>

        <div className="create-layout">
          {/* Form */}
          <div className="card create-form">
            <form onSubmit={handleSubmit}>
              {/* Image Upload */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Hình ảnh chiến dịch (IPFS)</label>
                <div
                  className={`image-drop-zone ${imagePreview ? "has-image" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById("imageInput").click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                  ) : (
                    <div className="drop-placeholder">
                      <span style={{ fontSize: 48 }}>🖼️</span>
                      <p>Kéo thả hoặc nhấn để chọn hình ảnh</p>
                      <span className="form-hint">PNG, JPG, GIF tối đa 10MB</span>
                      <span className="drop-ipfs-badge">⬡ Sẽ được lưu trên IPFS</span>
                    </div>
                  )}
                </div>
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
                {imageFile && (
                  <p className="form-hint" style={{ color: "#34d399" }}>
                    ✅ {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Title */}
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

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Mô tả chiến dịch *</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="Mô tả chi tiết mục đích, kế hoạch sử dụng tiền quyên góp..."
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  maxLength={1000}
                  required
                />
                <span className="form-hint">{form.description.length}/1000 ký tự</span>
              </div>

              {/* Category + Goal + Duration - Row */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Mục tiêu (ETH) *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#8b5cf6", fontSize: 18 }}>⬡</span>
                    <input
                      type="number"
                      name="goal"
                      className="form-input"
                      placeholder="1.0"
                      value={form.goal}
                      onChange={handleChange}
                      min="0.001"
                      step="0.001"
                      style={{ paddingLeft: 40 }}
                      required
                    />
                  </div>
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

              {/* IPFS Status */}
              {ipfsResult && (
                <div className="alert alert-success">
                  <span>✅</span>
                  <div>
                    <strong>Đã upload lên IPFS!</strong>
                    <br />
                    CID: <code style={{ fontSize: 11 }}>{ipfsResult.cid}</code>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={uploading || creating}
                style={{ marginTop: 8 }}
              >
                {uploading ? (
                  <><span className="spinner" /> Đang upload IPFS...</>
                ) : creating ? (
                  <><span className="spinner" /> Đang tạo trên blockchain...</>
                ) : (
                  <>🚀 Tạo Chiến Dịch</>
                )}
              </button>
            </form>
          </div>

          {/* Preview */}
          <div className="create-preview">
            <div className="card">
              <h3 style={{ color: "#f1f5f9", marginBottom: 16, fontSize: 16, fontWeight: 700 }}>
                👁️ Xem trước
              </h3>
              <div className="preview-image">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 48 }}>🎯</div>
                )}
              </div>
              <div style={{ marginTop: 16 }}>
                <h4 style={{ color: "#f1f5f9", fontWeight: 700 }}>{form.title || "Tên chiến dịch..."}</h4>
                <p style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>
                  {form.description.substring(0, 100) || "Mô tả chiến dịch..."}
                </p>
                {form.goal && (
                  <div style={{ marginTop: 12, color: "#a78bfa", fontWeight: 800, fontSize: 18 }}>
                    ⬡ Mục tiêu: {form.goal} ETH
                  </div>
                )}
                <div style={{ marginTop: 8, color: "#64748b", fontSize: 12 }}>
                  ⏰ Thời hạn: {form.durationDays} ngày
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ color: "#f1f5f9", marginBottom: 12, fontSize: 14, fontWeight: 700 }}>
                ⛓️ Quy trình
              </h3>
              <div className="process-steps">
                <div className="process-step">
                  <span className="process-step-num">1</span>
                  <div>
                    <strong>Upload hình ảnh → IPFS</strong>
                    <p>File lưu trên IPFS, trả về CID</p>
                  </div>
                </div>
                <div className="process-step">
                  <span className="process-step-num">2</span>
                  <div>
                    <strong>Smart Contract</strong>
                    <p>CID và thông tin lưu on-chain vĩnh viễn</p>
                  </div>
                </div>
                <div className="process-step">
                  <span className="process-step-num">3</span>
                  <div>
                    <strong>MetaMask xác nhận</strong>
                    <p>Ký transaction bằng private key</p>
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
