import React, { useState, useMemo } from 'react';
import { Member } from '../types';

interface MemberDirectoryProps {
  members: Member[];
  selectedId: string;
  onSelect: (id: string) => void;
  onViewTree: () => void;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  isAdminLoggedIn: boolean;
}

export default function MemberDirectory({
  members,
  selectedId,
  onSelect,
  onViewTree,
  onEdit,
  onDelete,
  isAdminLoggedIn,
}: MemberDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [generationFilter, setGenerationFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter members directory
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.birthPlace && m.birthPlace.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesGen = generationFilter === 'all' ? true : m.generation === parseInt(generationFilter);
      const matchesGender = genderFilter === 'all' ? true : m.gender === genderFilter;
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'living'
          ? !m.isDeceased
          : m.isDeceased;
      return matchesSearch && matchesGen && matchesGender && matchesStatus;
    });
  }, [members, searchQuery, generationFilter, genderFilter, statusFilter]);

  return (
    <div className="p-6 flex flex-col h-full overflow-y-auto print:overflow-visible print:p-0">
      {/* Directory Filter controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-stone-100 p-4 rounded-xl border border-stone-200 print:hidden">
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">Thế Hệ</label>
          <select
            value={generationFilter}
            onChange={(e) => setGenerationFilter(e.target.value)}
            className="w-full bg-white border border-stone-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-rose-900 focus:outline-none font-bold"
          >
            <option value="all">Tất Cả Các Đời (I - IV)</option>
            <option value="1">Thế Hệ I (Thủy Tổ)</option>
            <option value="2">Thế Hệ II (Các Chi Ngành)</option>
            <option value="3">Thế Hệ III (Đời Con)</option>
            <option value="4">Thế Hệ IV (Đời Cháu Chắt)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">Giới Tính</label>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="w-full bg-white border border-stone-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-rose-900 focus:outline-none font-bold"
          >
            <option value="all">Tất cả giới tính</option>
            <option value="male">Nam (Nội tộc)</option>
            <option value="female">Nữ (Nội/Ngoại/Dâu)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">Trạng Thái</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-stone-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-rose-900 focus:outline-none font-bold"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="living">Còn sống</option>
            <option value="deceased">Đã tạ thế (Đã mất)</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchQuery('');
              setGenerationFilter('all');
              setGenderFilter('all');
              setStatusFilter('all');
            }}
            className="w-full bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs py-2.5 rounded-lg transition duration-200 border border-stone-300 cursor-pointer"
          >
            Xóa Bộ Lọc
          </button>
        </div>
      </div>

      {/* Directory Search Box */}
      <div className="mb-4 relative print:hidden">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm tên thành viên, danh xưng, nơi sinh, quê quán nhanh..."
          className="block w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm bg-stone-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-950 focus:border-rose-950 font-bold"
        />
      </div>

      {/* Table Data list */}
      <div className="flex-grow overflow-x-auto print:overflow-visible">
        <table className="min-w-full divide-y divide-stone-200 print:border-collapse print:w-full">
          <thead className="bg-stone-50 print:bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider print:border print:border-stone-800 print:text-black">
                Họ & Tên
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider print:border print:border-stone-800 print:text-black">
                Thế Hệ
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider print:border print:border-stone-800 print:text-black">
                Vai Vế / Danh Xưng
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider print:border print:border-stone-800 print:text-black">
                Sinh / Mất
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider print:border print:border-stone-800 print:text-black">
                Quê Quán / Nơi Sinh
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-stone-500 uppercase tracking-wider print:hidden">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-150 print:divide-stone-800">
            {filteredMembers.map((member) => (
              <tr
                key={member.id}
                className={`hover:bg-amber-50/40 cursor-pointer transition ${
                  selectedId === member.id ? 'bg-amber-100/30 font-bold' : ''
                }`}
                onClick={() => onSelect(member.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap print:border print:border-stone-800">
                  <div className="flex items-center space-x-3">
                    <span className={`text-xl print:hidden ${member.gender === 'male' ? 'text-sky-600' : 'text-rose-500'}`}>
                      {member.gender === 'male' ? '♂' : '♀'}
                    </span>
                    <div className="text-sm font-bold text-stone-900 flex items-center gap-1.5 print:text-black">
                      {member.name}
                      {member.isDeceased && (
                        <span className="bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider print:border print:border-stone-800 print:bg-white print:text-black">
                          Đã mất
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 font-bold print:border print:border-stone-800 print:text-black">
                  Đời Thứ {member.generation}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-900 font-bold print:border print:border-stone-800 print:text-black">
                  {member.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 font-bold print:border print:border-stone-800 print:text-black">
                  {member.birthYear || '?'} – {member.isDeceased ? member.deathYear || 'Chưa rõ' : 'Nay'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 font-bold print:border print:border-stone-800 print:text-black">
                  {member.birthPlace || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold space-x-2 print:hidden" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      onSelect(member.id);
                      onViewTree();
                    }}
                    className="text-rose-900 hover:text-rose-800 font-bold cursor-pointer"
                  >
                    Xem Cây
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    onClick={() => onEdit(member)}
                    className="text-amber-800 hover:text-amber-700 font-bold cursor-pointer"
                  >
                    Sửa
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    onClick={() => onDelete(member.id)}
                    className="text-red-600 hover:text-red-500 font-bold cursor-pointer"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-stone-500 font-bold print:border print:border-stone-800">
                  Không tìm thấy thành viên phù hợp với bộ lọc tìm kiếm.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
