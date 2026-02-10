"use client";

import { useState } from "react";
import type { DhikrGroup, Dhikr } from "@/lib/athkari-data";
import { Switch } from "@/components/ui/switch";
import {
  Moon,
  Sun,
  Sunrise,
  Star,
  Plus,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Pencil,
  Sparkles,
  Trash2,
  X,
  Loader2,
  Heart,
  Flower2,
  HandMetal,
  CloudRain,
  Zap,
  Award,
  Crown,
  Leaf,
  Droplet,
  Flame,
  BookOpen,
} from "lucide-react";

export const ICON_OPTIONS = [
  { value: "moon", icon: <Moon size={20} />, label: "هلال", color: "#6366f1" },
  { value: "sun", icon: <Sun size={20} />, label: "شمس", color: "#f59e0b" },
  { value: "sunrise", icon: <Sunrise size={20} />, label: "شروق", color: "#f97316" },
  { value: "star", icon: <Star size={20} />, label: "نجمة", color: "#eab308" },
  { value: "heart", icon: <Heart size={20} />, label: "قلب", color: "#ec4899" },
  { value: "sparkles", icon: <Sparkles size={20} />, label: "تألق", color: "#8b5cf6" },
  { value: "flower", icon: <Flower2 size={20} />, label: "زهرة", color: "#d946ef" },
  { value: "hand", icon: <HandMetal size={20} />, label: "يد", color: "#14b8a6" },
  { value: "cloud", icon: <CloudRain size={20} />, label: "سحابة", color: "#3b82f6" },
  { value: "zap", icon: <Zap size={20} />, label: "برق", color: "#facc15" },
  { value: "award", icon: <Award size={20} />, label: "وسام", color: "#f59e0b" },
  { value: "crown", icon: <Crown size={20} />, label: "تاج", color: "#eab308" },
  { value: "leaf", icon: <Leaf size={20} />, label: "ورقة", color: "#22c55e" },
  { value: "droplet", icon: <Droplet size={20} />, label: "قطرة", color: "#0ea5e9" },
  { value: "flame", icon: <Flame size={20} />, label: "شعلة", color: "#ef4444" },
  { value: "book", icon: <BookOpen size={20} />, label: "كتاب", color: "#a855f7" },
];

function getGroupIcon(icon: string, size = 20) {
  const iconProps = { size };
  // Default logic for Groups (using standard color/icon mapping if needed)
  // For Groups specifically, we removed Icon Picker so it defaults mostly to Moon or generic.
  // But we use this helper.
  switch (icon) {
    case "moon": return <Moon {...iconProps} />;
    case "sunrise": return <Sunrise {...iconProps} />;
    case "sun": return <Sun {...iconProps} />;
    case "star": return <Star {...iconProps} />;
    case "heart": return <Heart {...iconProps} />;
    case "sparkles": return <Sparkles {...iconProps} />;
    case "flower": return <Flower2 {...iconProps} />;
    case "hand": return <HandMetal {...iconProps} />;
    case "cloud": return <CloudRain {...iconProps} />;
    case "zap": return <Zap {...iconProps} />;
    case "award": return <Award {...iconProps} />;
    case "crown": return <Crown {...iconProps} />;
    case "leaf": return <Leaf {...iconProps} />;
    case "droplet": return <Droplet {...iconProps} />;
    case "flame": return <Flame {...iconProps} />;
    case "book": return <BookOpen {...iconProps} />;
    default: return <Moon {...iconProps} />;
  }
}

export function getDhikrIconData(icon?: string) {
  if (!icon) return null;
  return ICON_OPTIONS.find((o) => o.value === icon);
}

function getDhikrIcon(icon?: string) {
  const data = getDhikrIconData(icon);
  return data ? data.icon : null;
}

/* ============================
   Dhikr Add/Edit Modal 
   ============================ */
interface DhikrFormModalProps {
  onClose: () => void;
  onSave: (data: {
    text: string;
    target: number;
    icon?: string;
    virtue: string;
  }) => void;
  initialData?: Dhikr;
  isEdit?: boolean;
}

function DhikrFormModal({
  onClose,
  onSave,
  initialData,
  isEdit,
}: DhikrFormModalProps) {
  const [text, setText] = useState(initialData?.text || "");
  const [target, setTarget] = useState(initialData?.target || 33);
  const [selectedIcon, setSelectedIcon] = useState<string>(
    initialData?.icon || ""
  );
  const [virtue, setVirtue] = useState(initialData?.virtue || "");
  const [searching, setSearching] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);



  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/30"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-t-3xl p-6 w-full max-w-lg shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-card-foreground text-lg">
            {isEdit ? "تعديل الذكر" : "إضافة ذكر جديد"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              نص الذكر
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب نص الذكر هنا..."
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-base resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30 font-serif"
              dir="rtl"
            />
          </div>

          {/* Target */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              عدد التكرار المستهدف
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
              min={1}
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              أيقونة الذكر (اختياري)
            </label>
            <button
              type="button"
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="flex items-center gap-2 p-3 rounded-xl border border-border bg-background text-foreground text-sm w-full min-h-[44px]"
            >
              {selectedIcon ? (
                <>
                  <span style={{ color: ICON_OPTIONS.find((o) => o.value === selectedIcon)?.color }}>
                    {getGroupIcon(selectedIcon)}
                  </span>
                  <span>
                    {ICON_OPTIONS.find((o) => o.value === selectedIcon)?.label}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">اختر أيقونة...</span>
              )}
            </button>
            {showIconPicker && (
              <div className="grid grid-cols-4 gap-2 mt-2 p-3 rounded-xl border border-border bg-background">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedIcon(
                        opt.value === selectedIcon ? "" : opt.value
                      );
                      setShowIconPicker(false);
                    }}
                    className={`flex items-center justify-center p-3 rounded-xl transition-all min-h-[48px] ${selectedIcon === opt.value
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-secondary hover:bg-secondary/80"
                      }`}
                  >
                    <div style={{ color: opt.color }}>
                      {opt.icon}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Virtue - manual input */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              فضل الذكر (اختياري)
            </label>
            <textarea
              value={virtue}
              onChange={(e) => setVirtue(e.target.value)}
              placeholder="اكتب فضل الذكر هنا أو استخدم الذكاء الاصطناعي..."
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
              dir="rtl"
            />
          </div>



          <button
            type="button"
            onClick={() => {
              if (text.trim()) {
                onSave({
                  text: text.trim(),
                  target,
                  icon: selectedIcon || undefined,
                  virtue:
                    virtue.trim() || "لم يتم إضافة فضل لهذا الذكر بعد.",
                });
                onClose();
              }
            }}
            disabled={!text.trim()}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 min-h-[48px]"
          >
            {isEdit ? "حفظ التعديلات" : "إضافة الذكر"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================
   Group Edit Modal 
   ============================ */
interface EditGroupModalProps {
  group: DhikrGroup;
  onClose: () => void;
  onSave: (name: string, icon: string) => void;
}

function EditGroupModal({ group, onClose, onSave }: EditGroupModalProps) {
  const [name, setName] = useState(group.name);
  const [icon, setIcon] = useState(group.icon);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/30 px-6"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-card-foreground text-lg mb-4">
          تعديل المجموعة
        </h3>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم المجموعة..."
          className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
          dir="rtl"
        />



        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm min-h-[44px]"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => {
              if (name.trim()) {
                onSave(name.trim(), icon);
                onClose();
              }
            }}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 min-h-[44px]"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================
   Add Group Modal 
   ============================ */
interface AddGroupModalProps {
  onClose: () => void;
  onAdd: (name: string, icon: string) => void;
}

function AddGroupModal({ onClose, onAdd }: AddGroupModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("moon");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/30 px-6"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-card-foreground text-lg mb-4">
          مجموعة جديدة
        </h3>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم المجموعة..."
          className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
          dir="rtl"
        />



        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm min-h-[44px]"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => {
              if (name.trim()) {
                onAdd(name.trim(), icon);
                onClose();
              }
            }}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 min-h-[44px]"
          >
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================
   Main Groups Screen 
   ============================ */
export default function GroupsScreen({
  groups,
  onToggleGroup,
  onToggleDhikr,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onAddDhikr,
  onEditDhikr,
  onDeleteDhikr,
  onReorderGroup,
  onReorderDhikr
}: {
  groups: DhikrGroup[];
  onToggleGroup: (id: string, state: boolean) => void;
  onToggleDhikr: (id: string, state: boolean) => void;
  onAddGroup: (name: string, icon: string) => Promise<boolean>;
  onEditGroup: (id: string, name: string, icon: string) => Promise<boolean>;
  onDeleteGroup: (id: string) => Promise<boolean>;
  onAddDhikr: (groupId: string, text: string, target: number, virtue?: string, icon?: string) => Promise<boolean>;
  onEditDhikr: (id: string, text: string, target: number, virtue?: string, icon?: string) => Promise<boolean>;
  onDeleteDhikr: (id: string) => Promise<boolean>;
  onReorderGroup: (id: string, direction: 'up' | 'down') => Promise<void> | void;
  onReorderDhikr: (id: string, direction: 'up' | 'down') => Promise<void> | void;
}) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showAddDhikr, setShowAddDhikr] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingDhikr, setEditingDhikr] = useState<Dhikr | null>(null);
  const [editingGroup, setEditingGroup] = useState<DhikrGroup | null>(null);

  const activeGroupData = groups.find((g) => g.id === selectedGroup);

  // const activeGroupData = groups.find((g) => g.id === selectedGroup); // Defined below

  const handleAddGroup = async (name: string, icon: string) => {
    const success = await onAddGroup(name, icon);
    if (success) setShowAddGroup(false);
  };

  const handleEditGroup = async (groupId: string, name: string, icon: string) => {
    const success = await onEditGroup(groupId, name, icon);
    if (success) setEditingGroup(null);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المجموعة؟')) {
      const success = await onDeleteGroup(groupId);
      if (success && selectedGroup === groupId) setSelectedGroup(null);
    }
  };

  const handleAddDhikr = async (data: {
    text: string;
    target: number;
    icon?: string;
    virtue: string;
  }) => {
    if (!selectedGroup) return;
    const success = await onAddDhikr(selectedGroup, data.text, data.target, data.virtue, data.icon);
    if (success) setShowAddDhikr(false);
  };

  const handleEditDhikr = async (
    dhikrId: string,
    data: { text: string; target: number; icon?: string; virtue: string }
  ) => {
    const success = await onEditDhikr(dhikrId, data.text, data.target, data.virtue, data.icon);
    if (success) setEditingDhikr(null);
  };

  const handleDeleteDhikr = async (dhikrId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الذكر؟')) {
      await onDeleteDhikr(dhikrId);
    }
  };

  // ===== Detail view for a group =====
  if (activeGroupData) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3">
          <button
            type="button"
            onClick={() => setSelectedGroup(null)}
            className="p-2.5 rounded-xl bg-secondary text-secondary-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {getGroupIcon(activeGroupData.icon, 18)}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground text-lg leading-tight">
              {activeGroupData.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {activeGroupData.adhkar.length} ذكر
            </p>
          </div>
        </div>

        {/* Adhkar List */}
        <div className="flex-1 overflow-y-auto px-4 pb-32">
          <div className="space-y-2">
            {activeGroupData.adhkar.map((dhikr, index) => (
              <div
                key={dhikr.id}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${dhikr.is_active === false ? "bg-secondary/30 border-border opacity-70" : "bg-card border-border"
                  }`}
              >
                {/* Toggle Swtich */}
                <div className="mt-1">
                  <Switch
                    checked={dhikr.is_active !== false}
                    onCheckedChange={(c) => onToggleDhikr(dhikr.id, c)}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-serif text-foreground text-base leading-relaxed">
                    {dhikr.text}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      التكرار: {dhikr.target} مرة
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-0.5 mr-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onReorderDhikr(dhikr.id, 'up')}
                      className="p-1 text-muted-foreground hover:text-primary disabled:opacity-20"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={index === activeGroupData.adhkar.length - 1}
                      onClick={() => onReorderDhikr(dhikr.id, 'down')}
                      className="p-1 text-muted-foreground hover:text-primary disabled:opacity-20"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingDhikr(dhikr)}
                    className="p-2.5 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDhikr(dhikr.id)}
                    className="p-2.5 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {activeGroupData.adhkar.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Moon size={40} className="mb-3 opacity-30" />
              <p className="text-sm">لا توجد أذكار في هذه المجموعة</p>
            </div>
          )}
          {/* Add Dhikr Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowAddDhikr(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm min-h-[48px]"
            >
              <Plus size={18} />
              <span>إضافة ذكر</span>
            </button>
          </div>
        </div>

        {/* Add Dhikr Modal */}
        {showAddDhikr && (
          <DhikrFormModal
            onClose={() => setShowAddDhikr(false)}
            onSave={handleAddDhikr}
          />
        )}

        {/* Edit Dhikr Modal */}
        {editingDhikr && (
          <DhikrFormModal
            onClose={() => setEditingDhikr(null)}
            onSave={(data) => {
              handleEditDhikr(editingDhikr.id, data);
              setEditingDhikr(null);
            }}
            initialData={editingDhikr}
            isEdit
          />
        )}
      </div>
    );
  }

  // ===== Groups list view =====
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3">
        <h2 className="font-semibold text-foreground text-xl">
          مجموعات الأذكار
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          إدارة وتنظيم أذكارك
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="space-y-2">
          {groups.map((group, index) => (
            <div
              key={group.id}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${group.is_active === false ? "bg-secondary/30 border-border opacity-70" : "bg-card border-border"
                }`}
            >
              {/* Toggle Switch */}
              <Switch
                checked={group.is_active !== false}
                onCheckedChange={(c) => onToggleGroup(group.id, c)}
              />


              <button
                type="button"
                className="flex-1 text-right min-w-0"
                onClick={() => setSelectedGroup(group.id)}
              >
                <p className="font-medium text-card-foreground truncate">
                  {group.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {group.adhkar.length} ذكر
                </p>
              </button>
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-0.5 mr-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onReorderGroup(group.id, 'up')}
                    className="p-1 text-muted-foreground hover:text-primary disabled:opacity-20"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={index === groups.length - 1}
                    onClick={() => onReorderGroup(group.id, 'down')}
                    className="p-1 text-muted-foreground hover:text-primary disabled:opacity-20"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingGroup(group)}
                  className="p-2.5 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-2.5 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Group Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAddGroup(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm min-h-[48px]"
          >
            <Plus size={18} />
            <span>إضافة مجموعة جديدة</span>
          </button>
        </div>
      </div>

      {/* Add Group Modal */}
      {showAddGroup && (
        <AddGroupModal
          onClose={() => setShowAddGroup(false)}
          onAdd={async (name, icon) => {
            const success = await onAddGroup(name, icon);
            if (success) setShowAddGroup(false);
          }}
        />
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onSave={async (name, icon) => {
            const success = await onEditGroup(editingGroup.id, name, icon);
            if (success) setEditingGroup(null);
          }}
        />
      )}
    </div>
  );
}
