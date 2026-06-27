import React, { useState } from 'react';
import { Member, AdminCredentials } from '../types';

interface AddMemberModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  selectedParentId: string;
  selectedSpouseId: string;
  members: Member[];
}

export function AddMemberModal({
  onClose,
  onSubmit,
  selectedParentId,
  selectedSpouseId,
  members,
}: AddMemberModalProps) {
  // Compute unique family branches for the suggestions list
  const existingBranches = React.useMemo(() => {
    const branches = new Set<string>();
    members.forEach((m) => {
      if (m.familyBranch && m.familyBranch.trim()) {
        branches.add(m.familyBranch.trim());
      }
    });
    return Array.from(branches).sort();
  }, [members]);

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-amber-500/20 my-8">
        <div className="bg-gradient-to-r from-rose-950 to-rose-900 p-5 text-amber-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Khai Báo Thành Viên Mới</h3>
          <button onClick={onClose} className="text-amber-200 hover:text-white text-lg font-bold cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Họ & Tên *</label>
              <input
                required
                name="name"
                type="text"
                placeholder="Nghiêm Đình..."
                className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-rose-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Giới Tính *</label>
              <select required name="gender" className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold bg-white">
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Thế Hệ (F1 - F4) *</label>
              <select required name="generation" className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold bg-white">
                <option value="1">Đời I (Cố/Tổ)</option>
                <option value="2">Đời II (Ông bà)</option>
                <option value="3">Đời III (Bố mẹ)</option>
                <option value="4">Đời IV (Con cháu)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Vai Vế / Danh Xưng</label>
              <input
                name="title"
                type="text"
                placeholder="Trưởng nam, dâu út, cháu nội..."
                className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Năm Sinh</label>
              <input
                name="birthYear"
                type="number"
                placeholder="Ví dụ: 1985"
                className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Đã tạ thế?</label>
              <select name="isDeceased" className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold bg-white">
                <option value="false">Còn sống</option>
                <option value="true">Đã khuất</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Năm Mất (Nếu đã mất)</label>
            <input
              name="deathYear"
              type="number"
              placeholder="Chỉ điền khi chọn Đã Khuất"
              className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nơi Sinh / Quê Quán</label>
            <input
              name="birthPlace"
              type="text"
              placeholder="Tỉnh thành, quốc gia..."
              className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nơi An Nghỉ (Nếu đã mất)</label>
            <input
              name="restingPlace"
              type="text"
              placeholder="Công viên nghĩa trang..."
              className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Chọn Cha (Nội Thân)</label>
              <select
                name="parentId"
                defaultValue={selectedParentId}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm bg-stone-50 font-bold"
              >
                <option value="">Không rõ hoặc nhánh ngoài</option>
                {members
                  .filter((m) => m.gender === 'male')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Đời {m.generation})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Chọn Bạn Đời (Hôn Phối)</label>
              <select
                name="spouseId"
                defaultValue={selectedSpouseId}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm bg-stone-50 font-bold"
              >
                <option value="">Chưa có / Chưa khai báo</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (Đời {m.generation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Bầu đoàn nhà cụ/ông/bà</label>
            <input
              name="familyBranch"
              type="text"
              list="family-branches-list"
              placeholder="Ví dụ: Nhà cụ Nghiêm Văn A, Nhánh ông Nghiêm Văn B..."
              className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
            />
            <datalist id="family-branches-list">
              {existingBranches.map((branch) => (
                <option key={branch} value={branch} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Sự Nghiệp / Đóng Góp</label>
            <textarea
              name="bio"
              rows={3}
              placeholder="Ghi nhận sự nghiệp, học vấn, tính cách, công trạng nổi bật..."
              className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-stone-150">
            <button
              type="button"
              onClick={onClose}
              className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs py-2 px-5 rounded-xl shadow cursor-pointer"
            >
              Lưu Thành Viên
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditMemberModalProps {
  onClose: () => void;
  selectedMember: Member;
  members: Member[];
  onUpdate: (updatedMembers: Member[]) => void;
  onShowToast: (msg: string, type: 'success' | 'warning' | 'info' | 'error') => void;
}

export function EditMemberModal({
  onClose,
  selectedMember,
  members,
  onUpdate,
  onShowToast,
}: EditMemberModalProps) {
  const [bioText, setBioText] = useState(selectedMember.bio || '');
  const [isGenerating, setIsGenerating] = useState(false);

  // Compute unique family branches for the suggestions list
  const existingBranches = React.useMemo(() => {
    const branches = new Set<string>();
    members.forEach((m) => {
      if (m.familyBranch && m.familyBranch.trim()) {
        branches.add(m.familyBranch.trim());
      }
    });
    return Array.from(branches).sort();
  }, [members]);

  // AI biography builder with server-side Gemini API
  const handleAIBiography = async () => {
    setIsGenerating(true);
    onShowToast('Trí tuệ nhân tạo Gemini đang biên soạn tiểu sử gia tộc...', 'info');

    try {
      const response = await fetch('/api/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member: {
            name: selectedMember.name,
            gender: selectedMember.gender,
            generation: selectedMember.generation,
            birthYear: selectedMember.birthYear,
            deathYear: selectedMember.deathYear,
            isDeceased: selectedMember.isDeceased,
            title: selectedMember.title,
            birthPlace: selectedMember.birthPlace,
            restingPlace: selectedMember.restingPlace,
            currentBio: bioText,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể kết nối đến máy chủ AI');
      }

      const data = await response.json();
      if (data.biography) {
        setBioText(data.biography);
        onShowToast('Đã biên soạn tiểu sử gia đình bằng AI thành công!', 'success');
      } else {
        throw new Error('Dữ liệu AI không hợp lệ');
      }
    } catch (error) {
      console.log('AI Generation error:', error);
      onShowToast('Lỗi AI: Vui lòng kiểm tra phím bí mật Gemini API Key hoặc thử lại.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const updated = members.map((m) => {
      if (m.id === selectedMember.id) {
        return {
          ...m,
          name: formData.get('name') as string,
          gender: formData.get('gender') as 'male' | 'female',
          generation: parseInt(formData.get('generation') as string),
          birthYear: (formData.get('birthYear') as string) || '',
          deathYear: formData.get('isDeceased') === 'true' ? (formData.get('deathYear') as string) : '',
          isDeceased: formData.get('isDeceased') === 'true',
          title: (formData.get('title') as string) || 'Thành viên',
          birthPlace: (formData.get('birthPlace') as string) || '',
          restingPlace: (formData.get('restingPlace') as string) || '',
          bio: bioText,
          familyBranch: (formData.get('familyBranch') as string) || '',
          spouseId: (formData.get('spouseId') as string) || '',
          parentId: (formData.get('parentId') as string) || '',
        };
      }
      return m;
    });

    onUpdate(updated);
    onClose();
    onShowToast('Cập nhật hồ sơ thành viên thành công!', 'success');
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-amber-500/20 my-8">
        <div className="bg-gradient-to-r from-amber-950 to-amber-900 p-5 text-amber-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Cập Nhật Thông Tin Thành Viên</h3>
          <button onClick={onClose} className="text-amber-200 hover:text-white text-lg font-bold cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Họ & Tên *</label>
              <input
                required
                name="name"
                type="text"
                defaultValue={selectedMember.name}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-rose-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Giới Tính *</label>
              <select
                required
                name="gender"
                defaultValue={selectedMember.gender}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold bg-white"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Thế Hệ (F1 - F4) *</label>
              <select
                required
                name="generation"
                defaultValue={selectedMember.generation}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold bg-white"
              >
                <option value="1">Đời I (Cố/Tổ)</option>
                <option value="2">Đời II (Ông bà)</option>
                <option value="3">Đời III (Bố mẹ)</option>
                <option value="4">Đời IV (Con cháu)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Vai Vế / Danh Xưng</label>
              <input
                name="title"
                type="text"
                defaultValue={selectedMember.title}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Năm Sinh</label>
              <input
                name="birthYear"
                type="number"
                defaultValue={selectedMember.birthYear}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Đã tạ thế?</label>
              <select
                name="isDeceased"
                defaultValue={selectedMember.isDeceased ? 'true' : 'false'}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold bg-white"
              >
                <option value="false">Còn sống</option>
                <option value="true">Đã khuất</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Năm Mất (Nếu đã mất)</label>
            <input
              name="deathYear"
              type="number"
              defaultValue={selectedMember.deathYear}
              className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nơi Sinh / Quê Quán</label>
            <input
              name="birthPlace"
              type="text"
              defaultValue={selectedMember.birthPlace}
              className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nơi An Nghỉ (Nếu đã mất)</label>
            <input
              name="restingPlace"
              type="text"
              defaultValue={selectedMember.restingPlace}
              className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Chọn Cha (Nội Thân)</label>
              <select
                name="parentId"
                defaultValue={selectedMember.parentId}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm bg-stone-50 font-bold"
              >
                <option value="">Không rõ hoặc nhánh ngoài</option>
                {members
                  .filter((m) => m.gender === 'male' && m.id !== selectedMember.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Đời {m.generation})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Chọn Bạn Đời (Hôn Phối)</label>
              <select
                name="spouseId"
                defaultValue={selectedMember.spouseId}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm bg-stone-50 font-bold"
              >
                <option value="">Chưa có / Chưa khai báo</option>
                {members
                  .filter((m) => m.id !== selectedMember.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Đời {m.generation})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Bầu đoàn nhà cụ/ông/bà</label>
            <input
              name="familyBranch"
              type="text"
              list="edit-family-branches-list"
              defaultValue={selectedMember.familyBranch || ''}
              placeholder="Ví dụ: Nhà cụ Nghiêm Văn A, Nhánh ông Nghiêm Văn B..."
              className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold"
            />
            <datalist id="edit-family-branches-list">
              {existingBranches.map((branch) => (
                <option key={branch} value={branch} />
              ))}
            </datalist>
          </div>

          {/* Biography Block with Gemini API Writer trigger button */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-stone-500 uppercase">Tiểu Sử / Sự Nghiệp / Công Trạng</label>
              <button
                type="button"
                onClick={handleAIBiography}
                disabled={isGenerating}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-bold cursor-pointer transition ${
                  isGenerating ? 'opacity-55 cursor-not-allowed' : ''
                }`}
              >
                <span>✨ AI Viết Tiểu Sử</span>
              </button>
            </div>
            <textarea
              name="bio"
              rows={4}
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              placeholder="Nhập ghi chú thô hoặc bấm nút AI viết tiểu sử phía trên để tự động soạn thảo trang trọng..."
              className="w-full border border-stone-300 rounded-lg p-2 text-sm font-bold leading-relaxed"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-stone-150">
            <button
              type="button"
              onClick={onClose}
              className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs py-2 px-5 rounded-xl shadow cursor-pointer"
            >
              Cập Nhật
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface LoginModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function LoginModal({ onClose, onSubmit }: LoginModalProps) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-amber-500/30">
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 p-5 text-amber-100 flex flex-col items-center">
          <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-full mb-2">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="font-bold text-lg text-center uppercase tracking-wider">ĐĂNG NHẬP BAN QUẢN TRỊ</h3>
          <p className="text-[10px] text-stone-300 mt-1 font-bold">Chế độ ghi, chỉnh sửa và quản lý cấu trúc phả đồ</p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Tên Đăng Nhập</label>
            <input
              required
              name="username"
              type="text"
              placeholder="Tài khoản quản trị..."
              className="w-full border border-stone-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-rose-900 focus:outline-none font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Mật Khẩu</label>
            <input
              required
              name="password"
              type="password"
              placeholder="••••••••"
              className="w-full border border-stone-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-rose-900 focus:outline-none font-bold"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-[10px] text-amber-900 flex items-start space-x-1.5 leading-relaxed font-bold">
            <span>💡</span>
            <span>
              Tài khoản mặc định ban đầu là: <strong>admin</strong> và mật khẩu: <strong>123</strong>. Bạn có thể thay đổi sau khi đăng nhập thành công.
            </span>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-stone-150">
            <button
              type="button"
              onClick={onClose}
              className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
            >
              Bỏ qua
            </button>
            <button
              type="submit"
              className="bg-rose-950 hover:bg-rose-900 text-amber-100 font-bold text-xs py-2 px-5 rounded-xl shadow cursor-pointer"
            >
              Đăng Nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ChangeCredsModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  adminCreds: AdminCredentials;
}

export function ChangeCredsModal({ onClose, onSubmit, adminCreds }: ChangeCredsModalProps) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-amber-500/30">
        <div className="bg-gradient-to-r from-amber-950 to-amber-900 p-5 text-amber-100 flex flex-col items-center">
          <h3 className="font-bold text-lg uppercase tracking-wider">Cấu Hình Quản Trị Hệ Thống</h3>
          <p className="text-[10px] text-stone-300 mt-1 font-bold text-center leading-relaxed">Thay đổi tài khoản mật khẩu đăng nhập của ban trị sự phả tộc</p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Tài khoản mới</label>
            <input
              required
              name="newUsername"
              type="text"
              defaultValue={adminCreds.username}
              className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-rose-900 focus:outline-none font-bold"
            />
          </div>

          <div className="h-px bg-stone-200 my-2" />

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Mật khẩu mới</label>
            <input
              required
              name="newPassword"
              type="password"
              placeholder="Nhập mật khẩu quản trị mới"
              className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-rose-900 focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Mật khẩu hiện tại (Để xác thực) *</label>
            <input
              required
              name="currentPassword"
              type="password"
              placeholder="Xác nhận mật khẩu cũ"
              className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-rose-900 focus:outline-none font-bold"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-stone-150">
            <button
              type="button"
              onClick={onClose}
              className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs py-2 px-5 rounded-xl shadow cursor-pointer"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
