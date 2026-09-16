import React, { useState } from 'react';
import { CheckCheck, Tag, ShoppingBag, MoreVertical, Pencil, Trash2, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const OfferCard = ({ offerData, isOwnMessage }) => {
  const href = `/listings/${offerData.listing_slug || offerData.listing_id}?offered_price=${offerData.price}`;
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 min-w-[220px] max-w-[260px]">
      <div className="flex items-center gap-2 px-3 py-2 bg-custom-green-500">
        <Tag className="w-3.5 h-3.5 text-white flex-shrink-0" />
        <span className="text-[11px] font-bold text-white uppercase tracking-wide">Offre de prix</span>
      </div>
      <div className="px-3 py-2.5 bg-white">
        <p className="text-[12px] font-semibold text-gray-700 leading-tight mb-1 line-clamp-2">{offerData.title}</p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-[20px] font-black text-custom-green-500 tabular-nums leading-none">
            {Number(offerData.price).toLocaleString('fr-FR')} FCFA
          </span>
          {offerData.original_price && Number(offerData.original_price) > Number(offerData.price) && (
            <span className="text-[12px] text-gray-400 line-through tabular-nums">
              {Number(offerData.original_price).toLocaleString('fr-FR')}
            </span>
          )}
        </div>
        {isOwnMessage ? (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
            <ShoppingBag className="w-3.5 h-3.5" />
            En attente de paiement
          </div>
        ) : (
          <Link
            to={href}
            className="flex items-center justify-center gap-1.5 w-full h-9 rounded-lg bg-custom-green-500 text-white text-[12px] font-bold hover:bg-custom-green-600 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Payer {Number(offerData.price).toLocaleString('fr-FR')} FCFA
          </Link>
        )}
      </div>
    </div>
  );
};

const Message = ({ message, isOwnMessage, onEdit, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const isOffer = message.content?.startsWith('__OFFER__:');
  let offerData = null;
  if (isOffer) {
    try { offerData = JSON.parse(message.content.slice(9)); } catch { /* malformed */ }
  }

  const isDeleted = !!message.deleted_at;

  const saveEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.content) { setEditing(false); setDraft(message.content); return; }
    setBusy(true);
    await onEdit?.(message.id, trimmed);
    setBusy(false);
    setEditing(false);
  };

  const confirmAndDelete = async () => {
    setBusy(true);
    await onDelete?.(message.id);
    setBusy(false);
    setConfirmDelete(false);
  };

  const ActionsMenu = () => (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute top-1 -left-7 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Options du message"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {!isOffer && (
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Modifier
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-red-600 focus:text-red-600">
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce message ?</AlertDialogTitle>
            <AlertDialogDescription>
              {message.is_read
                ? "Le destinataire a déjà lu ce message. Il verra qu'un message a été supprimé."
                : "Le destinataire n'a pas encore lu ce message — il ne le verra jamais."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndDelete} disabled={busy} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (isDeleted) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} px-3 mb-0.5`}>
        <div className="max-w-[78%] shadow-sm bg-gray-100 rounded-2xl px-3 py-2 flex items-center gap-1.5">
          <Trash2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <p className="text-[13px] text-gray-400 italic">Message supprimé</p>
        </div>
      </div>
    );
  }

  if (isOffer && offerData) {
    return (
      <div className={`group relative flex ${isOwnMessage ? 'justify-end' : 'justify-start'} px-3 mb-0.5`}>
        <div className="relative">
          {isOwnMessage && <ActionsMenu />}
          <OfferCard offerData={offerData} isOwnMessage={isOwnMessage} />
          <div className={`flex items-center gap-1 mt-0.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-gray-400">{formatTime(message.created_at)}</span>
            {isOwnMessage && (
              message.is_read
                ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] flex-shrink-0" />
                : <CheckCheck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative flex ${isOwnMessage ? 'justify-end' : 'justify-start'} px-3 mb-0.5`}>
      <div
        className="relative max-w-[78%] shadow-sm"
        style={{
          backgroundColor: isOwnMessage ? '#d9fdd3' : '#ffffff',
          borderRadius: isOwnMessage
            ? '18px 18px 4px 18px'
            : '18px 18px 18px 4px',
          padding: '7px 12px 5px 12px',
        }}
      >
        {isOwnMessage && !editing && <ActionsMenu />}

        {/* Queue de la bulle */}
        {isOwnMessage ? (
          <div style={{
            position: 'absolute', bottom: 0, right: -7,
            width: 0, height: 0,
            borderLeft: '8px solid #d9fdd3',
            borderBottom: '8px solid transparent',
          }} />
        ) : (
          <div style={{
            position: 'absolute', bottom: 0, left: -7,
            width: 0, height: 0,
            borderRight: '8px solid #ffffff',
            borderBottom: '8px solid transparent',
          }} />
        )}

        {editing ? (
          <div className="min-w-[200px]">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
              rows={2}
              className="w-full text-[13.5px] text-gray-900 bg-white/70 rounded-lg p-1.5 border border-gray-300 focus:outline-none focus:border-custom-green-500 resize-none"
            />
            <div className="flex items-center justify-end gap-1 mt-1">
              <button
                onClick={() => { setEditing(false); setDraft(message.content); }}
                disabled={busy}
                className="w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:bg-black/5"
                aria-label="Annuler"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={saveEdit}
                disabled={busy}
                className="w-6 h-6 flex items-center justify-center rounded-full text-custom-green-600 hover:bg-black/5"
                aria-label="Enregistrer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[13.5px] text-gray-900 leading-[1.45] whitespace-pre-wrap break-words">
              {message.content}
            </p>

            {/* Heure + statut */}
            <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
              {message.edited_at && (
                <span className="text-[10px] text-gray-400 italic leading-none">modifié</span>
              )}
              <span className="text-[10px] text-gray-400 leading-none">
                {formatTime(message.created_at)}
              </span>
              {isOwnMessage && (
                message.is_read
                  ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] flex-shrink-0" />
                  : <CheckCheck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Message;
