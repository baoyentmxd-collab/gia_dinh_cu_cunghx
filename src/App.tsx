import React, { useState, useEffect, useMemo } from 'react';
import { Member, MemorialTribute, ActiveTab, AdminCredentials } from './types';
import { INITIAL_MEMBERS, INITIAL_TRIBUTES } from './data/initialData';
import FamilyTreeCanvas from './components/FamilyTreeCanvas';
import MemberDirectory from './components/MemberDirectory';
import FamilyTimeline from './components/FamilyTimeline';
import MemorialHall from './components/MemorialHall';
import FamilyStats from './components/FamilyStats';
import Toast from './components/Toast';
import {
  AddMemberModal,
  EditMemberModal,
  LoginModal,
  ChangeCredsModal,
} from './components/Modals';

export default function App() {
  // Members State
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('gia_pha_data');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  // Tributes State (Memorial guestbook)
  const [tributes, setTributes] = useState<MemorialTribute[]>(() => {
    const saved = localStorage.getItem('gia_pha_tributes');
    return saved ? JSON.parse(saved) : INITIAL_TRIBUTES;
  });

  const [selectedId, setSelectedId] = useState<string>(() => {
    const saved = localStorage.getItem('gia_pha_data');
    const parsed = saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    return parsed[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('tree');

  // Lit candles state
  const [litCandles, setLitCandles] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('lit_candles');
    return saved ? JSON.parse(saved) : {};
  });

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    const sessionActive = sessionStorage.getItem('is_admin_active');
    return sessionActive === 'true';
  });

  const [adminCreds, setAdminCreds] = useState<AdminCredentials>(() => {
    const savedCreds = localStorage.getItem('gia_pha_admin_creds');
    return savedCreds ? JSON.parse(savedCreds) : { username: 'admin', password: '123' };
  });

  // Modals & Menu states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showChangeCredsModal, setShowChangeCredsModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedSpouseId, setSelectedSpouseId] = useState('');

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);

  // Supabase state
  const [dbInitSql, setDbInitSql] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync data to localStorage as local fallback cache
  useEffect(() => {
    localStorage.setItem('gia_pha_data', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('gia_pha_tributes', JSON.stringify(tributes));
  }, [tributes]);

  useEffect(() => {
    localStorage.setItem('lit_candles', JSON.stringify(litCandles));
  }, [litCandles]);

  useEffect(() => {
    localStorage.setItem('gia_pha_admin_creds', JSON.stringify(adminCreds));
  }, [adminCreds]);

  // Load initial data from Supabase
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true);
        // Fetch members
        const membersRes = await fetch('/api/members');
        const membersData = await membersRes.json();
        if (membersData && membersData.error) {
          if (membersData.error === 'database_not_initialized') {
            setDbInitSql(membersData.sql);
            setIsLoading(false);
            return;
          } else {
            console.warn('Server database error, using local fallback:', membersData.error);
            showNotification(`Lỗi Supabase: ${membersData.error || 'không rõ'}. Đang dùng dữ liệu ngoại tuyến.`, 'warning');
          }
        } else if (Array.isArray(membersData)) {
          setMembers(membersData);
          if (membersData.length > 0) {
            setSelectedId(membersData[0].id);
          }
        }

        // Fetch tributes
        const tributesRes = await fetch('/api/tributes');
        const tributesData = await tributesRes.json();
        if (tributesData && tributesData.error) {
          console.warn('Could not fetch tributes:', tributesData.error);
        } else if (Array.isArray(tributesData)) {
          setTributes(tributesData);
        }

        // Fetch lit candles
        const candlesRes = await fetch('/api/lit-candles');
        const candlesData = await candlesRes.json();
        if (candlesData && typeof candlesData === 'object' && !candlesData.error) {
          setLitCandles(candlesData);
        }

        // Fetch admin creds
        const credsRes = await fetch('/api/admin-creds');
        const credsData = await credsRes.json();
        if (credsData && credsData.username && !credsData.error) {
          setAdminCreds(credsData);
        }

        setIsLoading(false);
      } catch (err) {
        console.log('Error loading Supabase data:', err);
        showNotification('Lỗi kết nối cơ sở dữ liệu Supabase, đang dùng dữ liệu ngoại tuyến tạm thời.', 'error');
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  const showNotification = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedId) || members[0];
  }, [members, selectedId]);

  // Process core counts for header
  const statsSummary = useMemo(() => {
    const total = members.length;
    const livingCount = members.filter((m) => !m.isDeceased).length;
    const deceasedCount = total - livingCount;
    return { total, livingCount, deceasedCount };
  }, [members]);

  // Admin permission guard helper
  const checkAdminPermission = (actionText = 'thực hiện hành động này') => {
    if (!isAdminLoggedIn) {
      showNotification(`Vui lòng đăng nhập Quản Trị Viên để ${actionText}!`, 'warning');
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  // Add Family Member Logic (Automatic two-way relations alignment)
  const handleAddMemberSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!checkAdminPermission('thêm thành viên mới')) return;

    const formData = new FormData(e.currentTarget);
    const newId = `member-${Date.now()}`;
    const parentId = (formData.get('parentId') as string) || '';
    const spouseId = (formData.get('spouseId') as string) || '';

    const newMemberObj: Member = {
      id: newId,
      name: formData.get('name') as string,
      gender: formData.get('gender') as 'male' | 'female',
      generation: parseInt(formData.get('generation') as string),
      birthYear: (formData.get('birthYear') as string) || '',
      deathYear: formData.get('isDeceased') === 'true' ? (formData.get('deathYear') as string) : '',
      isDeceased: formData.get('isDeceased') === 'true',
      title: (formData.get('title') as string) || 'Thành viên',
      birthPlace: (formData.get('birthPlace') as string) || '',
      restingPlace: (formData.get('restingPlace') as string) || '',
      bio: (formData.get('bio') as string) || '',
      spouseId: spouseId,
      parentId: parentId,
      childrenIds: [],
    };

    let updatedMembers = [...members, newMemberObj];

    // Update parent's childrenIds list
    if (parentId) {
      updatedMembers = updatedMembers.map((m) => {
        if (m.id === parentId) {
          const currentChildren = m.childrenIds || [];
          return { ...m, childrenIds: currentChildren.includes(newId) ? currentChildren : [...currentChildren, newId] };
        }
        return m;
      });
    }

    // Update spouse's partner id
    if (spouseId) {
      updatedMembers = updatedMembers.map((m) => {
        if (m.id === spouseId) {
          return { ...m, spouseId: newId };
        }
        return m;
      });
    }

    setMembers(updatedMembers);
    setShowAddModal(false);
    setSelectedId(newId);

    try {
      // Insert new member on server
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemberObj),
      });

      // Update relationship structures on server
      await fetch('/api/members/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers }),
      });

      showNotification('Đã thêm thành viên mới và đồng bộ lên Supabase thành công!', 'success');
    } catch (err) {
      console.log('Error adding member to Supabase:', err);
      showNotification('Lưu cục bộ thành công, đồng bộ Supabase thất bại!', 'error');
    }
  };

  // Edit Family Member & Relational adjustment
  const handleUpdateMembers = async (updated: Member[]) => {
    // We compare with original members to update parent & spouse relationships if they were changed
    let finalMembers = [...updated];

    // Align reverse children ids for parent changes
    members.forEach((oldMember) => {
      const updatedMember = updated.find((m) => m.id === oldMember.id);
      if (!updatedMember) return;

      // Parent changed
      if (oldMember.parentId !== updatedMember.parentId) {
        // Remove from old parent
        if (oldMember.parentId) {
          finalMembers = finalMembers.map((p) => {
            if (p.id === oldMember.parentId) {
              return { ...p, childrenIds: (p.childrenIds || []).filter((cid) => cid !== oldMember.id) };
            }
            return p;
          });
        }
        // Add to new parent
        if (updatedMember.parentId) {
          finalMembers = finalMembers.map((p) => {
            if (p.id === updatedMember.parentId) {
              const children = p.childrenIds || [];
              return {
                ...p,
                childrenIds: children.includes(updatedMember.id) ? children : [...children, updatedMember.id],
              };
            }
            return p;
          });
        }
      }

      // Spouse changed
      if (oldMember.spouseId !== updatedMember.spouseId) {
        // Clear old spouse's reference
        if (oldMember.spouseId) {
          finalMembers = finalMembers.map((sp) => {
            if (sp.id === oldMember.spouseId) {
              return { ...sp, spouseId: '' };
            }
            return sp;
          });
        }
        // Attach new spouse's reference
        if (updatedMember.spouseId) {
          finalMembers = finalMembers.map((sp) => {
            if (sp.id === updatedMember.spouseId) {
              return { ...sp, spouseId: updatedMember.id };
            }
            return sp;
          });
        }
      }
    });

    setMembers(finalMembers);
    setShowEditModal(false);

    try {
      const res = await fetch('/api/members/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: finalMembers }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotification('Đã cập nhật thành viên và đồng bộ lên Supabase thành công!', 'success');
    } catch (err) {
      console.log('Error updating members bulk in Supabase:', err);
      showNotification('Cập nhật cục bộ thành công, đồng bộ Supabase thất bại!', 'error');
    }
  };

  // Delete Member logic (Auto clean up references to prevent ghost nodes)
  const handleDeleteMember = async (id: string) => {
    if (!checkAdminPermission('xóa thành viên')) return;

    if (id === 'g1-p1' || id === 'g1-p2') {
      showNotification('Không thể xóa Thủy Tổ cốt lõi của dòng tộc Nghiêm Gia!', 'error');
      return;
    }

    const customConfirm = window.confirm(
      'Bạn có chắc chắn muốn xóa thành viên này? Toàn bộ các liên kết cha mẹ, con cái và bạn đời liên quan sẽ được tự động dọn dẹp để đảm bảo tính toàn vẹn phả hệ.'
    );
    if (!customConfirm) return;

    let updated = members.filter((m) => m.id !== id);

    // Clean up all reference occurrences
    updated = updated.map((m) => {
      let changed = false;
      let spouseIdVal = m.spouseId;
      let parentIdVal = m.parentId;
      let childrenIdsVal = m.childrenIds || [];

      if (m.spouseId === id) {
        spouseIdVal = '';
        changed = true;
      }
      if (m.parentId === id) {
        parentIdVal = '';
        changed = true;
      }
      if (childrenIdsVal.includes(id)) {
        childrenIdsVal = childrenIdsVal.filter((cId) => cId !== id);
        changed = true;
      }

      return changed
        ? { ...m, spouseId: spouseIdVal, parentId: parentIdVal, childrenIds: childrenIdsVal }
        : m;
    });

    setMembers(updated);
    setSelectedId(updated[0]?.id || '');

    try {
      const res = await fetch('/api/members/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updated }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotification('Đã xóa thành viên và đồng bộ hóa lên Supabase thành công!', 'warning');
    } catch (err) {
      console.log('Error deleting member in Supabase:', err);
      showNotification('Xóa cục bộ thành công, đồng bộ Supabase thất bại!', 'error');
    }
  };

  // Export Data to JSON Back-up file
  const handleExportData = () => {
    if (!checkAdminPermission('xuất dữ liệu phả đồ')) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(members, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'gia_pha_nghiem_gia_backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Đã tải xuống tệp sao lưu gia phả thành công!', 'success');
  };

  // Export Data to Word Doc table list
  const handleExportWord = () => {
    if (!checkAdminPermission('xuất dữ liệu phả đồ')) return;
    const header =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Danh sách Nghiêm Gia</title><style>table { border-collapse: collapse; width: 100%; font-family: 'Times New Roman', serif; } th, td { border: 1px solid #000; padding: 8px; text-align: left; vertical-align: top; } th { background-color: #f2f2f2; } h2, p { font-family: 'Times New Roman', serif; text-align: center; }</style></head><body><h2>DANH SÁCH THÀNH VIÊN GIA PHẢ - NGHIÊM GIA ĐẠI TỘC</h2><p>Ngày trích xuất: " +
      new Date().toLocaleDateString('vi-VN') +
      '</p>';
    const footer = '</body></html>';
    let tableHtml =
      '<table><tr><th>Họ và Tên</th><th>Thế hệ</th><th>Giới tính</th><th>Trạng thái</th><th>Sinh - Mất</th><th>Quê Quán / Nơi an nghỉ</th><th>Vai vế</th></tr>';

    members.forEach((m) => {
      tableHtml += `<tr><td><strong>${m.name}</strong></td><td>Đời thứ ${m.generation}</td><td>${
        m.gender === 'male' ? 'Nam' : 'Nữ'
      }</td><td>${m.isDeceased ? 'Đã mất' : 'Còn sống'}</td><td>${m.birthYear || '?'} - ${
        m.isDeceased ? m.deathYear || '?' : 'Nay'
      }</td><td>${m.isDeceased ? m.restingPlace || '—' : m.birthPlace || '—'}</td><td>${
        m.title || 'Thành viên'
      }</td></tr>`;
    });

    tableHtml += '</table>';
    const sourceHTML = header + tableHtml + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement('a');
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'Danh_Sach_Gia_Pha_Nghiem_Gia.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);

    showNotification('Đã xuất tệp Word (.doc) thành công!', 'success');
    setShowExportMenu(false);
  };

  // Import Data from JSON File Upload
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkAdminPermission('nhập dữ liệu phả đồ')) {
      e.target.value = '';
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
          setMembers(parsed);
          setSelectedId(parsed[0].id);

          const res = await fetch('/api/members/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ members: parsed }),
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);

          showNotification('Đã nhập và đồng bộ hóa dữ liệu lên Supabase thành công!', 'success');
        } else {
          showNotification('Định dạng tệp dữ liệu không hợp lệ!', 'error');
        }
      } catch (err) {
        showNotification('Có lỗi xảy ra khi đọc hoặc đồng bộ dữ liệu!', 'error');
      }
    };
    fileReader.readAsText(files[0]);
    e.target.value = ''; // Reset input to allow re-upload of same file name
  };

  // Admin Authentication Handling
  const handleAdminLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const user = formData.get('username') as string;
    const pass = formData.get('password') as string;

    if (user === adminCreds.username && pass === adminCreds.password) {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('is_admin_active', 'true');
      setShowLoginModal(false);
      showNotification("Đăng nhập quyền Quản trị viên thành công!", "success");
    } else {
      showNotification("Sai tài khoản hoặc mật khẩu quản trị!", "error");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('is_admin_active');
    showNotification("Đã thoát chế độ Quản trị viên.", "info");
  };

  const handleChangeCreds = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdminLoggedIn) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const currentPass = formData.get('currentPassword') as string;
    const newUsername = formData.get('newUsername') as string;
    const newPassword = formData.get('newPassword') as string;

    if (currentPass !== adminCreds.password) {
      showNotification("Mật khẩu hiện tại không chính xác!", "error");
      return;
    }

    if (!newUsername || !newPassword) {
      showNotification("Tài khoản và mật khẩu mới không được để trống!", "error");
      return;
    }

    setAdminCreds({ username: newUsername, password: newPassword });
    setShowChangeCredsModal(false);

    try {
      const res = await fetch('/api/admin-creds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotification("Thay đổi thông tin đăng nhập quản trị thành công!", "success");
    } catch (err) {
      console.log('Error updating admin credentials in Supabase:', err);
      showNotification("Thay đổi cục bộ thành công, đồng bộ Supabase thất bại!", "error");
    }
  };

  // Toggle memorial lights
  const handleToggleCandle = async (id: string) => {
    const isLit = !litCandles[id];
    setLitCandles((prev) => {
      const next = { ...prev, [id]: isLit };
      if (isLit) {
        const deceasedMember = members.find((m) => m.id === id);
        showNotification(
          `Đã thắp một ngọn nến thành tâm tri ân chân linh Cụ/Ông/Bà ${
            deceasedMember ? deceasedMember.name : ''
          }.`,
          'success'
        );
      }
      return next;
    });

    try {
      await fetch('/api/lit-candles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: id, isLit }),
      });
    } catch (err) {
      console.log('Error toggling candle in Supabase:', err);
    }
  };

  const handleAddTribute = async (tributeData: Omit<MemorialTribute, 'id' | 'createdAt'>) => {
    const newTribute: MemorialTribute = {
      id: `tr-${Date.now()}`,
      memberId: tributeData.memberId,
      authorName: tributeData.authorName,
      content: tributeData.content,
      createdAt: new Date().toISOString(),
    };
    setTributes([newTribute, ...tributes]);
    showNotification('Đã ghi dâng lời tri ân thành công!', 'success');

    try {
      await fetch('/api/tributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTribute),
      });
    } catch (err) {
      console.log('Error adding tribute in Supabase:', err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col selection:bg-rose-900 selection:text-amber-100 print:bg-white print:text-black">
      
      {/* Supabase Initialization Banner */}
      {dbInitSql && (
        <div className="bg-amber-50 border-b border-amber-200 text-stone-800 p-6 print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="flex-1 space-y-2">
              <h3 className="font-bold text-amber-900 text-base flex items-center gap-2">
                ⚠️ CẦN KHỞI TẠO BẢNG SUPABASE
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed">
                Hệ thống phát hiện thấy dự án Supabase mới của bạn chưa được khởi tạo cấu trúc bảng. 
                Hãy nhấn nút bên phải để sao chép mã SQL khởi tạo, sau đó truy cập <strong>Supabase Dashboard &gt; SQL Editor</strong>, dán mã vào và nhấn <strong>Run</strong>. Sau đó tải lại trang này để hoàn tất đồng bộ!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(dbInitSql);
                  showNotification('Đã sao chép mã SQL khởi tạo vào clipboard!', 'success');
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow transition duration-150 cursor-pointer"
              >
                Sao Chép Mã SQL Khởi Tạo
              </button>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-stone-900 hover:bg-stone-800 text-amber-100 font-bold text-xs py-2.5 px-5 rounded-xl shadow transition duration-150 text-center flex items-center justify-center"
              >
                Mở Supabase Dashboard ↗
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Global CSS to enforce Times New Roman font and setup print styles */}
      <style>{`
        :root, body, button, input, select, textarea, span, p, h1, h2, h3, h4, h5, h6, td, th {
          font-family: "Times New Roman", Times, serif !important;
        }

        @media print {
          @page { margin: 1cm; size: auto; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:w-full { width: 100% !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:border-none { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:overflow-visible { overflow: visible !important; }
          .print\\:max-w-none { max-width: none !important; }
        }
      `}</style>

      {/* Toast System */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* --- HEADER FOR PRINTING ONLY --- */}
      <div className="hidden print:block text-center pt-8 pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">DANH SÁCH THÀNH VIÊN GIA PHẢ</h1>
        <p className="text-md italic text-stone-700 font-bold">NGHIÊM GIA ĐẠI TỘC</p>
        <p className="text-sm italic text-stone-600">Ngày xuất bản: {new Date().toLocaleDateString('vi-VN')}</p>
      </div>

      {/* --- PREMIUM ROYAL HEADER --- */}
      <header className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-amber-100 shadow-xl border-b-2 border-amber-600/40 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo / Title */}
          <div className="flex items-center space-x-4">
            <div className="p-2.5 bg-amber-500/10 border-2 border-amber-500/60 rounded-xl shadow-inner flex items-center justify-center">
              <svg className="w-9 h-9 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                PHẢ ĐỒ NGHIÊM GIA ĐẠI TỘC
              </h1>
              <p className="text-xs text-stone-300 font-medium">Hệ thống Số hóa & Lưu trữ Phả tộc Khoa học & Trường tồn</p>
            </div>
          </div>

          {/* Quick Realtime Stats Summary Bar */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
            <div className="bg-stone-900/40 border border-stone-700/50 rounded-lg px-3 py-1 text-center">
              <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Tổng thành viên</span>
              <span className="text-amber-300 font-semibold text-base">{statsSummary.total} người</span>
            </div>
            <div className="bg-stone-900/40 border border-stone-700/50 rounded-lg px-3 py-1 text-center">
              <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Thế hệ hiện diện</span>
              <span className="text-amber-300 font-semibold text-base">4 Đời</span>
            </div>
            <div className="bg-stone-900/40 border border-stone-700/50 rounded-lg px-3 py-1 text-center">
              <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Đã khuất / Còn sống</span>
              <span className="text-amber-300 font-semibold text-base">{statsSummary.deceasedCount} / {statsSummary.livingCount}</span>
            </div>
          </div>
          
          {/* Action buttons & Admin auth controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Admin State Indicator */}
            <div className="flex items-center space-x-2 mr-1">
              {isAdminLoggedIn ? (
                <div className="flex items-center space-x-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Quyền Quản Trị</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 bg-stone-800/60 text-stone-400 border border-stone-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                  <span>Chế độ: Đọc</span>
                </div>
              )}
            </div>

            {/* Export Dropdown Menu */}
            <div className="relative">
              <button 
                id="btn-export-dropdown"
                onClick={() => {
                   if (!checkAdminPermission("xuất dữ liệu phả đồ")) return;
                   setShowExportMenu(!showExportMenu);
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition duration-200 border shadow-md cursor-pointer ${
                  isAdminLoggedIn 
                    ? 'bg-amber-600 hover:bg-amber-700 text-stone-950 border-amber-500/50' 
                    : 'bg-stone-800/50 text-stone-400 border-stone-700/50 hover:bg-stone-800 cursor-not-allowed'
                }`}
              >
                <span>Xuất Dữ Liệu</span>
                <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {showExportMenu && isAdminLoggedIn && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-200 z-50 py-1 overflow-hidden">
                    <button id="btn-export-word" onClick={handleExportWord} className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100 font-semibold flex items-center gap-2 cursor-pointer">
                      <span>Xuất Danh Sách (.docx)</span>
                    </button>
                    <button id="btn-export-pdf" onClick={() => { window.print(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100 font-semibold flex items-center gap-2 cursor-pointer">
                      <span>In / Lưu PDF (.pdf)</span>
                    </button>
                    <div className="border-t border-stone-200 my-1"></div>
                    <button id="btn-export-json" onClick={() => { handleExportData(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100 font-semibold flex items-center gap-2 cursor-pointer">
                      <span>Tải Bản Sao Lưu (.json)</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Import Data */}
            <label className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition duration-200 border cursor-pointer ${
              isAdminLoggedIn 
                ? 'bg-stone-800 hover:bg-stone-700 text-amber-100 border-stone-700' 
                : 'bg-stone-800/30 text-stone-500 border-stone-800/40 hover:bg-stone-800/50 cursor-not-allowed'
            }`}>
              <span>Nhập Dữ Liệu</span>
              <input 
                id="file-input-import"
                type="file" 
                accept=".json" 
                onChange={handleImportData} 
                className="hidden" 
                disabled={!isAdminLoggedIn} 
              />
            </label>

            {/* Admin Access Button */}
            {isAdminLoggedIn ? (
              <div className="flex items-center space-x-1">
                <button
                  id="btn-admin-config"
                  onClick={() => setShowChangeCredsModal(true)}
                  className="p-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-100 rounded-lg transition text-xs font-semibold cursor-pointer"
                  title="Cấu hình hệ thống"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  id="btn-admin-logout"
                  onClick={handleAdminLogout}
                  className="px-3 py-1.5 bg-rose-900 hover:bg-rose-850 text-white rounded-lg transition text-xs font-semibold cursor-pointer border border-rose-800 flex items-center space-x-1"
                >
                  <span>Thoát</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-admin-login-trigger"
                onClick={() => setShowLoginModal(true)}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-stone-950 rounded-lg transition text-xs font-bold cursor-pointer border border-amber-400 flex items-center space-x-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Quản Trị Viên</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* --- VIEW TABS SELECTOR --- */}
      <section className="bg-white border-b border-stone-200 shadow-sm sticky top-[68px] z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 py-2">
          
          {/* Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'tree', label: 'Cây Gia Phả', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
              { id: 'directory', label: 'Danh Sách Thành Viên', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
              { id: 'timeline', label: 'Biên Niên Sử', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'memorial', label: 'Tưởng Nhớ & Tâm Hương', icon: 'M11.25 11.25a9 9 0 111.5 1.5' },
              { id: 'statistics', label: 'Thống Kê Dòng Họ', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2' }
            ].map(tab => (
              <button
                key={tab.id}
                id={`tab-selector-${tab.id}`}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-rose-900 text-amber-100 shadow-md font-extrabold' 
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Quick Action additions */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-add-member-top"
              onClick={() => {
                if (!checkAdminPermission("thêm thành viên mới")) return;
                setSelectedParentId('');
                setSelectedSpouseId('');
                setShowAddModal(true);
              }}
              className="flex items-center space-x-1.5 bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs py-2 px-4 rounded-xl border border-amber-500/20 shadow-md cursor-pointer transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Thêm Mới Thành Viên</span>
            </button>
          </div>
          
        </div>
      </section>

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="flex-grow max-w-[1500px] w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col xl:flex-row gap-6 items-stretch print:p-0 print:m-0 print:w-full print:block">
        
        {/* LEFT WORKSPACE / ACTIVE VIEW DISPLAY */}
        <div className="flex-grow bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px] xl:min-h-[700px] print:shadow-none print:border-none print:min-h-0 print:block print:overflow-visible">
          
          {isLoading ? (
            <div className="flex-grow flex flex-col items-center justify-center p-12 py-24">
              <div className="w-10 h-10 border-4 border-rose-950 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 font-bold text-stone-600 text-sm">Đang đồng bộ cơ sở dữ liệu Supabase...</p>
            </div>
          ) : (
            <>
              {activeTab === 'tree' && (
                <FamilyTreeCanvas
                  members={members}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  litCandles={litCandles}
                />
              )}

              {activeTab === 'directory' && (
                <MemberDirectory
                  members={members}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onViewTree={() => setActiveTab('tree')}
                  onEdit={(m) => {
                    setSelectedId(m.id);
                    if (checkAdminPermission('sửa thông tin thành viên')) {
                      setShowEditModal(true);
                    }
                  }}
                  onDelete={handleDeleteMember}
                  isAdminLoggedIn={isAdminLoggedIn}
                />
              )}

              {activeTab === 'timeline' && (
                <FamilyTimeline
                  members={members}
                  onSelectMember={(id) => {
                    setSelectedId(id);
                    setActiveTab('tree');
                  }}
                />
              )}

              {activeTab === 'memorial' && (
                <MemorialHall
                  members={members}
                  litCandles={litCandles}
                  onToggleCandle={handleToggleCandle}
                  tributes={tributes}
                  onAddTribute={handleAddTribute}
                />
              )}

              {activeTab === 'statistics' && (
                <FamilyStats
                  members={members}
                  litCandles={litCandles}
                />
              )}
            </>
          )}

        </div>

        {/* --- RIGHT SIDEBAR: MEMBER DETAILS PANEL --- */}
        <aside className="w-full xl:w-96 shrink-0 flex flex-col gap-6 print:hidden">
          
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm sticky top-[140px]">
            <div className="flex items-center justify-between border-b border-stone-150 pb-4 mb-4">
              <h3 className="font-bold text-stone-900 text-base">Hồ Sơ Thành Viên</h3>
              <div className="flex items-center space-x-1">
                <button 
                  id="aside-btn-edit"
                  onClick={() => {
                    if (checkAdminPermission("sửa thông tin thành viên")) {
                      setShowEditModal(true);
                    }
                  }}
                  className="p-1.5 hover:bg-stone-100 text-stone-600 rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  Sửa
                </button>
                <span className="text-stone-300">|</span>
                <button 
                  id="aside-btn-delete"
                  onClick={() => handleDeleteMember(selectedMember.id)}
                  className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            </div>

            {/* Avatar & Title header */}
            <div className="flex flex-col items-center text-center my-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-inner relative overflow-hidden border-2 ${
                selectedMember.gender === 'male' 
                  ? 'bg-sky-50 text-sky-800 border-sky-200' 
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {selectedMember.name.split(' ').pop()?.substring(0, 1)}
                {selectedMember.isDeceased && (
                  <div className="absolute inset-0 bg-stone-950/45 flex items-center justify-center">
                    <span className="text-xs text-amber-200 font-bold tracking-wider">✝</span>
                  </div>
                )}
              </div>
              <h2 className="text-lg font-bold text-stone-900 mt-3">{selectedMember.name}</h2>
              <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold mt-1.5 border border-amber-300/40">
                {selectedMember.title || 'Thành viên'}
              </span>
              <p className="text-stone-500 text-xs mt-1 font-bold">
                Thế hệ thứ {selectedMember.generation} (Đời F{selectedMember.generation})
              </p>
            </div>

            {/* Core Specs List */}
            <div className="space-y-3.5 my-6 text-sm">
              <div className="flex justify-between items-start border-b border-stone-100 pb-2">
                <span className="text-stone-400 font-bold">Trạng thái:</span>
                <span className={`font-bold ${selectedMember.isDeceased ? 'text-stone-600' : 'text-emerald-600'}`}>
                  {selectedMember.isDeceased ? 'Đã tạ thế (Đã khuất)' : 'Còn sống'}
                </span>
              </div>
              
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-400 font-bold">Năm sinh:</span>
                <span className="font-bold text-stone-800">{selectedMember.birthYear || 'Chưa rõ'}</span>
              </div>

              {selectedMember.isDeceased && (
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-400 font-bold">Năm mất (Thọ):</span>
                  <span className="font-bold text-stone-800">
                    {selectedMember.deathYear || 'Chưa rõ'} 
                    {selectedMember.birthYear && selectedMember.deathYear && ` (Thọ ${parseInt(selectedMember.deathYear) - parseInt(selectedMember.birthYear)} tuổi)`}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-400 font-bold">Quê quán / Nơi sinh:</span>
                <span className="font-bold text-stone-800 text-right">{selectedMember.birthPlace || '—'}</span>
              </div>

              {selectedMember.isDeceased && selectedMember.restingPlace && (
                <div className="flex flex-col border-b border-stone-100 pb-2">
                  <span className="text-stone-400 font-bold">Nơi an nghỉ:</span>
                  <span className="font-bold text-stone-800 text-xs mt-1">{selectedMember.restingPlace}</span>
                </div>
              )}

              {/* Spouse */}
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-400 font-bold">Hôn phối (Bạn đời):</span>
                <span className="font-bold text-stone-800">
                  {selectedMember.spouseId ? (
                    <button 
                      onClick={() => setSelectedId(selectedMember.spouseId)}
                      className="text-rose-900 hover:underline font-bold text-xs cursor-pointer"
                    >
                      {members.find((m) => m.id === selectedMember.spouseId)?.name}
                    </button>
                  ) : 'Chưa cập nhật'}
                </span>
              </div>
              
              {/* Father */}
              {selectedMember.parentId && (
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-400 font-bold">Cha đẻ (Nội thân):</span>
                  <span className="font-bold text-stone-800">
                    <button 
                      onClick={() => setSelectedId(selectedMember.parentId)}
                      className="text-rose-900 hover:underline font-bold text-xs cursor-pointer"
                    >
                      {members.find((m) => m.id === selectedMember.parentId)?.name}
                    </button>
                  </span>
                </div>
              )}

            </div>

            {/* Biography */}
            {selectedMember.bio && (
              <div className="mb-6 bg-stone-50 p-3.5 rounded-xl border border-stone-150 max-h-48 overflow-y-auto">
                <h4 className="font-bold text-xs uppercase text-stone-500 mb-1">Ghi Chú Tiểu Sử / Công Trạng</h4>
                <p className="text-xs text-stone-750 leading-relaxed italic font-bold">"{selectedMember.bio}"</p>
              </div>
            )}

            {/* Children List */}
            {selectedMember.childrenIds && selectedMember.childrenIds.length > 0 && (
              <div>
                <h4 className="font-bold text-xs uppercase text-stone-500 mb-2">Hậu Duệ (Con Cái)</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMember.childrenIds.map((childId) => {
                    const child = members.find((m) => m.id === childId);
                    if (!child) return null;
                    return (
                      <button
                        key={childId}
                        onClick={() => setSelectedId(childId)}
                        className="bg-stone-100 hover:bg-amber-100 text-stone-800 text-xs py-1.5 px-2.5 rounded-lg border border-stone-200 transition font-bold cursor-pointer"
                      >
                        {child.name} ({child.gender === 'male' ? 'Con trai' : 'Con gái'})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick action: Add descendant */}
            <div className="mt-6 pt-4 border-t border-stone-150">
              <button 
                id="btn-add-descendant-quick"
                onClick={() => {
                  if (!checkAdminPermission("thêm hậu duệ")) return;
                  setSelectedParentId(selectedMember.id);
                  setSelectedSpouseId('');
                  setShowAddModal(true);
                }}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition duration-200 cursor-pointer"
              >
                + Thêm Hậu Duệ Cho Thành Viên Này
              </button>
            </div>

          </div>

        </aside>

      </main>

      {/* --- ADD NEW MEMBER MODAL --- */}
      {showAddModal && (
        <AddMemberModal
          members={members}
          selectedParentId={selectedParentId}
          selectedSpouseId={selectedSpouseId}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddMemberSubmit}
        />
      )}

      {/* --- EDIT MEMBER MODAL (With AI biography builder) --- */}
      {showEditModal && (
        <EditMemberModal
          selectedMember={selectedMember}
          members={members}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdateMembers}
          onShowToast={showNotification}
        />
      )}

      {/* --- ADMIN LOGIN MODAL --- */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSubmit={handleAdminLogin}
        />
      )}

      {/* --- CHANGE CREDENTIALS MODAL --- */}
      {showChangeCredsModal && (
        <ChangeCredsModal
          onClose={() => setShowChangeCredsModal(false)}
          onSubmit={handleChangeCreds}
          adminCreds={adminCreds}
        />
      )}

      {/* --- FOOTER BANNER --- */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 border-t-2 border-amber-600/30 print:hidden mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="font-bold text-stone-300">"Mộc hữu bản, thủy hữu nguyên • Nhân hữu tổ, vạn vật tôn thờ nguồn cội"</p>
          <p className="font-bold">© 2026 Nghiêm Gia Đại Tộc • Số hóa Phả hệ & Ký ức Gia tộc • Thiết kế chuyên nghiệp, trường tồn ngàn đời</p>
        </div>
      </footer>

    </div>
  );
}
