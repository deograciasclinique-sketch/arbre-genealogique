import React, { useState, useEffect, useMemo } from 'react';
import { FamilyData, FamilyMember, FamilyEvent, ActivityLogItem, ActivityType } from './types';
import { INITIAL_FAMILY_DATA } from './data/initialData';
import { Navbar, NavTab } from './components/Navbar';
import { MeetingView } from './components/MeetingView';
import { FamilyTreeCanvas } from './components/FamilyTreeCanvas';
import { TimelineView } from './components/TimelineView';
import { MemberDirectoryView } from './components/MemberDirectoryView';
import { FamilyMapView } from './components/FamilyMapView';
import { StatsView } from './components/StatsView';
import { MemberProfileModal } from './components/MemberProfileModal';
import { MemberFormModal } from './components/MemberFormModal';
import { EventFormModal } from './components/EventFormModal';
import { ExportImportModal } from './components/ExportImportModal';
import { UpcomingBirthdaysModal } from './components/UpcomingBirthdaysModal';
import { UpcomingBirthdaysWidget } from './components/UpcomingBirthdaysWidget';
import { ActivityLogModal } from './components/ActivityLogModal';
import { InviteMemberModal } from './components/InviteMemberModal';
import { PublicMemberRequestPage } from './components/PublicMemberRequestPage';
import { ImportSubmittedMemberModal } from './components/ImportSubmittedMemberModal';
import { AccessGate } from './components/AccessGate';
import { ChangeAccessCodeModal } from './components/ChangeAccessCodeModal';
import { getUpcomingBirthdays } from './utils/birthdayUtils';
import { ACTIVITY_STORAGE_KEY, INITIAL_ACTIVITIES } from './utils/activityUtils';
import { decodePayload, InviteRequestPayload, InviteSubmissionPayload } from './utils/inviteUtils';
import { RelationType, RelationPlan, applyRelationPlan } from './utils/relationUtils';

const STORAGE_KEY = 'family_genealogy_app_data_v1';

// A relative filling their own card opens a link with ?remplir=... — that view
// is fully standalone and never touches this device's family data.
function getIncomingRequest(): InviteRequestPayload | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('remplir');
  if (!encoded) return null;
  const decoded = decodePayload<InviteRequestPayload>(encoded);
  return decoded && decoded.type === 'request' ? decoded : null;
}

// When a filled-in fiche comes back via ?fiche=..., the app owner sees an
// import preview instead of the link silently doing nothing.
function getIncomingSubmission(): InviteSubmissionPayload | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('fiche');
  if (!encoded) return null;
  const decoded = decodePayload<InviteSubmissionPayload>(encoded);
  return decoded && decoded.type === 'submission' ? decoded : null;
}

export default function App() {
  const incomingRequest = useMemo(() => getIncomingRequest(), []);

  // The public form page is a completely separate, lightweight view.
  if (incomingRequest) {
    return <PublicMemberRequestPage request={incomingRequest} />;
  }

  return (
    <AccessGate>
      <MainApp />
    </AccessGate>
  );
}

function MainApp() {
  const [familyData, setFamilyData] = useState<FamilyData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.members && Array.isArray(parsed.members)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved family tree:', e);
    }
    return INITIAL_FAMILY_DATA;
  });

  // Activity Log State with local persistence
  const [activities, setActivities] = useState<ActivityLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved activity log:', e);
    }
    return INITIAL_ACTIVITIES;
  });

  // Save activities to local storage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
    } catch (e) {
      console.error('Error saving activities to storage:', e);
    }
  }, [activities]);

  const logActivity = (
    type: ActivityType,
    title: string,
    details: string,
    targetName: string,
    targetPhotoUrl?: string,
    targetId?: string
  ) => {
    const newItem: ActivityLogItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      details,
      targetName,
      targetPhotoUrl,
      targetId,
    };
    setActivities((prev) => [newItem, ...prev.slice(0, 99)]); // Keep last 100 entries
  };

  // Save to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(familyData));
    } catch (e: any) {
      console.error('Error saving family tree to storage:', e);
      if (e?.name === 'QuotaExceededError' || e?.code === 22) {
        alert(
          "Attention : l'espace de stockage de votre navigateur (localStorage) est presque saturé. Veuillez exporter votre arbre depuis les paramètres."
        );
      }
    }
  }, [familyData]);

  const [activeTab, setActiveTab] = useState<NavTab>('tree');

  // Modal States
  const [profileMember, setProfileMember] = useState<FamilyMember | null>(null);

  const [memberModal, setMemberModal] = useState<{
    isOpen: boolean;
    member?: FamilyMember | null;
    presetParentId?: string;
    presetSpouseId?: string;
  }>({ isOpen: false });

  const [eventModal, setEventModal] = useState<{
    isOpen: boolean;
    event?: FamilyEvent | null;
    presetMemberId?: string;
  }>({ isOpen: false });

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isChangeCodeOpen, setIsChangeCodeOpen] = useState(false);
  const [isBirthdaysModalOpen, setIsBirthdaysModalOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

  // WhatsApp invite flow
  const [inviteModal, setInviteModal] = useState<{
    isOpen: boolean;
    presetReferenceId?: string;
    presetRelation?: RelationType;
  }>({ isOpen: false });

  const [incomingSubmission, setIncomingSubmission] = useState<InviteSubmissionPayload | null>(() =>
    getIncomingSubmission()
  );

  // Clear the ?fiche=... param from the URL once we've read it, so refreshing
  // or sharing the link again doesn't re-trigger the import prompt.
  useEffect(() => {
    if (incomingSubmission) {
      const url = new URL(window.location.href);
      url.searchParams.delete('fiche');
      window.history.replaceState({}, '', url.toString());
    }
  }, [incomingSubmission]);

  // Calculate upcoming birthdays for notification & widget
  const upcomingBirthdays30 = useMemo(() => {
    return getUpcomingBirthdays(familyData.members, { maxDays: 30, includeDeceased: false });
  }, [familyData.members]);

  // Quick action helpers
  const handleOpenAddMember = () => {
    setMemberModal({ isOpen: true, member: null });
  };

  const handleOpenAddChild = (parent: FamilyMember) => {
    setMemberModal({
      isOpen: true,
      member: null,
      presetParentId: parent.id,
    });
  };

  const handleOpenAddSpouse = (member: FamilyMember) => {
    setMemberModal({
      isOpen: true,
      member: null,
      presetSpouseId: member.id,
    });
  };

  const handleOpenEditMember = (member: FamilyMember) => {
    setMemberModal({
      isOpen: true,
      member,
    });
  };

  const handleOpenAddEvent = (presetMember?: FamilyMember) => {
    setEventModal({
      isOpen: true,
      event: null,
      presetMemberId: presetMember?.id,
    });
  };

  const handleOpenEditEvent = (event: FamilyEvent) => {
    setEventModal({
      isOpen: true,
      event,
    });
  };

  // Member Mutation Handlers
  const handleSaveMember = (savedMember: FamilyMember) => {
    const isExisting = familyData.members.some((m) => m.id === savedMember.id);

    setFamilyData((prev) => {
      const exists = prev.members.some((m) => m.id === savedMember.id);
      let updatedMembers: FamilyMember[];

      if (exists) {
        updatedMembers = prev.members.map((m) => (m.id === savedMember.id ? savedMember : m));
      } else {
        updatedMembers = [...prev.members, savedMember];
      }

      // Synchronize bidirectional relationships
      updatedMembers = updatedMembers.map((m) => {
        // If this member is the newly assigned spouse
        if (savedMember.spouseId === m.id) {
          return { ...m, spouseId: savedMember.id };
        }
        // If this member had this person as spouse, but spouse changed
        if (m.spouseId === savedMember.id && savedMember.spouseId !== m.id) {
          return { ...m, spouseId: undefined };
        }

        // If this member is listed in parentIds of savedMember, ensure childrenIds contains savedMember
        if (savedMember.parentIds.includes(m.id)) {
          const currentChildren = m.childrenIds || [];
          if (!currentChildren.includes(savedMember.id)) {
            return { ...m, childrenIds: [...currentChildren, savedMember.id] };
          }
        }

        return m;
      });

      return {
        ...prev,
        members: updatedMembers,
      };
    });

    // Log the member addition or edition
    if (isExisting) {
      logActivity(
        'member_edit',
        `Modification de ${savedMember.firstName} ${savedMember.lastName}`,
        `Fiche mise à jour (${savedMember.occupation || 'Informations complétées'})`,
        `${savedMember.firstName} ${savedMember.lastName}`,
        savedMember.photoUrl,
        savedMember.id
      );
    } else {
      logActivity(
        'member_add',
        `Ajout de ${savedMember.firstName} ${savedMember.lastName}`,
        `Nouveau membre rattaché à l'arbre généalogique`,
        `${savedMember.firstName} ${savedMember.lastName}`,
        savedMember.photoUrl,
        savedMember.id
      );
    }

    setMemberModal({ isOpen: false });
    // Update profile if currently viewed
    if (profileMember && profileMember.id === savedMember.id) {
      setProfileMember(savedMember);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    const deletedMember = familyData.members.find((m) => m.id === memberId);

    setFamilyData((prev) => {
      const remainingMembers = prev.members
        .filter((m) => m.id !== memberId)
        .map((m) => ({
          ...m,
          parentIds: m.parentIds.filter((pId) => pId !== memberId),
          childrenIds: m.childrenIds.filter((cId) => cId !== memberId),
          spouseId: m.spouseId === memberId ? undefined : m.spouseId,
        }));

      const updatedEvents = prev.events.map((ev) => ({
        ...ev,
        memberIds: ev.memberIds.filter((mId) => mId !== memberId),
      }));

      return {
        ...prev,
        members: remainingMembers,
        events: updatedEvents,
      };
    });

    if (deletedMember) {
      logActivity(
        'member_delete',
        `Suppression de ${deletedMember.firstName} ${deletedMember.lastName}`,
        `Membre et ses liens retirés de l'arbre`,
        `${deletedMember.firstName} ${deletedMember.lastName}`,
        deletedMember.photoUrl
      );
    }

    if (profileMember?.id === memberId) {
      setProfileMember(null);
    }
  };

  // Event Mutation Handlers
  const handleSaveEvent = (savedEvent: FamilyEvent) => {
    const isExisting = familyData.events.some((ev) => ev.id === savedEvent.id);

    setFamilyData((prev) => {
      const exists = prev.events.some((ev) => ev.id === savedEvent.id);
      return {
        ...prev,
        events: exists
          ? prev.events.map((ev) => (ev.id === savedEvent.id ? savedEvent : ev))
          : [...prev.events, savedEvent],
      };
    });

    if (isExisting) {
      logActivity(
        'event_edit',
        `Événement modifié : ${savedEvent.title}`,
        savedEvent.description || 'Détails de la chronologie mis à jour',
        savedEvent.title,
        savedEvent.photoUrl,
        savedEvent.id
      );
    } else {
      logActivity(
        'event_add',
        `Événement : ${savedEvent.title}`,
        savedEvent.description || 'Nouvel événement consigné dans l’histoire familiale',
        savedEvent.title,
        savedEvent.photoUrl,
        savedEvent.id
      );
    }

    setEventModal({ isOpen: false });
  };

  const handleDeleteEvent = (eventId: string) => {
    const deletedEvent = familyData.events.find((ev) => ev.id === eventId);
    setFamilyData((prev) => ({
      ...prev,
      events: prev.events.filter((ev) => ev.id !== eventId),
    }));

    if (deletedEvent) {
      logActivity(
        'event_delete',
        `Suppression d'événement : ${deletedEvent.title}`,
        'Événement retiré de la chronologie',
        deletedEvent.title
      );
    }
  };

  // Family Identity & Reset
  const handleUpdateFamilyName = (familyName: string, motto: string) => {
    setFamilyData((prev) => ({ ...prev, familyName, motto }));
    logActivity(
      'member_edit',
      `Identité familiale : Famille ${familyName}`,
      motto ? `Devise : « ${motto} »` : 'Nom de famille mis à jour',
      familyName
    );
  };

  const handleClearAll = () => {
    setFamilyData({
      familyName: 'Nouvelle Famille',
      motto: '',
      members: [],
      events: [],
    });
    setProfileMember(null);
    logActivity(
      'tree_reset',
      'Arbre vidé',
      'Tous les membres et souvenirs ont été réinitialisés',
      'Nouvelle Famille'
    );
  };

  // Applies a fiche received via WhatsApp: adds the new member and wires up
  // every reciprocal link (parent/child/spouse) the resolved relation plan calls for.
  const handleImportSubmission = (newMember: FamilyMember, plan: RelationPlan) => {
    setFamilyData((prev) => ({
      ...prev,
      members: applyRelationPlan(prev.members, newMember, plan),
    }));

    logActivity(
      'member_add',
      `Ajout de ${newMember.firstName} ${newMember.lastName}`,
      plan.resolved
        ? `Fiche reçue par WhatsApp — ${plan.description}`
        : 'Fiche reçue par WhatsApp — lien de parenté à compléter manuellement',
      `${newMember.firstName} ${newMember.lastName}`,
      newMember.photoUrl,
      newMember.id
    );

    setIncomingSubmission(null);
  };

  const handleImportData = (newData: FamilyData) => {
    setFamilyData(newData);
    setProfileMember(null);
    logActivity(
      'tree_import',
      `Importation de l’arbre « Famille ${newData.familyName} »`,
      `${newData.members.length} membres et ${newData.events.length} événements chargés`,
      newData.familyName
    );
  };

  return (
    <div className="min-h-screen flex flex-col text-stone-800 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        familyName={familyData.familyName}
        memberCount={familyData.members.length}
        eventCount={familyData.events.length}
        upcomingBirthdaysCount={upcomingBirthdays30.length}
        activityCount={activities.length}
        onOpenBirthdaysModal={() => setIsBirthdaysModalOpen(true)}
        onOpenActivityLog={() => setIsActivityLogOpen(true)}
        onAddMember={handleOpenAddMember}
        onAddEvent={() => handleOpenAddEvent()}
        onOpenExportImport={() => setIsExportOpen(true)}
        onOpenInvite={() => setInviteModal({ isOpen: true })}
        onOpenChangeAccessCode={() => setIsChangeCodeOpen(true)}
      />

      {/* Upcoming Birthdays Notification Banner / Widget */}
      <UpcomingBirthdaysWidget
        upcomingItems={upcomingBirthdays30}
        onOpenAll={() => setIsBirthdaysModalOpen(true)}
        onSelectMember={(m) => setProfileMember(m)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'tree' && (
          <FamilyTreeCanvas
            members={familyData.members}
            onSelectMember={(m) => setProfileMember(m)}
            onAddMember={handleOpenAddMember}
            onAddChild={handleOpenAddChild}
            onAddSpouse={handleOpenAddSpouse}
            onAddEventForMember={(m) => handleOpenAddEvent(m)}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            events={familyData.events}
            members={familyData.members}
            onAddEvent={() => handleOpenAddEvent()}
            onEditEvent={handleOpenEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onSelectMember={(m) => setProfileMember(m)}
          />
        )}

        {activeTab === 'directory' && (
          <MemberDirectoryView
            members={familyData.members}
            onSelectMember={(m) => setProfileMember(m)}
            onAddMember={handleOpenAddMember}
            onAddChild={handleOpenAddChild}
            onAddSpouse={handleOpenAddSpouse}
            onAddEventForMember={(m) => handleOpenAddEvent(m)}
          />
        )}

        {activeTab === 'map' && (
          <FamilyMapView
            members={familyData.members}
            familyName={familyData.familyName}
            onSelectMember={(m) => setProfileMember(m)}
            onEditMember={handleOpenEditMember}
          />
        )}

        {activeTab === 'stats' && (
          <StatsView
            members={familyData.members}
            events={familyData.events}
            familyName={familyData.familyName}
            activities={activities}
            onSelectMember={(m) => setProfileMember(m)}
            onOpenMap={() => setActiveTab('map')}
            onOpenActivityLog={() => setIsActivityLogOpen(true)}
          />
        )}

        {activeTab === 'meeting' && <MeetingView familyName={familyData.familyName} />}
      </main>

      {/* Profile Detail Modal */}
      {profileMember && (
        <MemberProfileModal
          member={profileMember}
          allMembers={familyData.members}
          allEvents={familyData.events}
          onClose={() => setProfileMember(null)}
          onEdit={(m) => handleOpenEditMember(m)}
          onDelete={handleDeleteMember}
          onSelectRelative={(m) => setProfileMember(m)}
          onAddChild={handleOpenAddChild}
          onAddSpouse={handleOpenAddSpouse}
          onAddEventForMember={(m) => handleOpenAddEvent(m)}
          onViewOnMap={(m) => {
            setProfileMember(null);
            setActiveTab('map');
          }}
        />
      )}

      {/* Member Creation / Editing Modal */}
      {memberModal.isOpen && (
        <MemberFormModal
          initialMember={memberModal.member}
          allMembers={familyData.members}
          presetParentId={memberModal.presetParentId}
          presetSpouseId={memberModal.presetSpouseId}
          onSave={handleSaveMember}
          onClose={() => setMemberModal({ isOpen: false })}
        />
      )}

      {/* Event Creation / Editing Modal */}
      {eventModal.isOpen && (
        <EventFormModal
          initialEvent={eventModal.event}
          presetMemberId={eventModal.presetMemberId}
          allMembers={familyData.members}
          onSave={handleSaveEvent}
          onClose={() => setEventModal({ isOpen: false })}
        />
      )}

      {/* Export / Import & Backup Modal */}
      {isExportOpen && (
        <ExportImportModal
          data={familyData}
          onUpdateFamilyName={handleUpdateFamilyName}
          onImportData={handleImportData}
          onClearAll={handleClearAll}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {/* Change the family access code */}
      <ChangeAccessCodeModal isOpen={isChangeCodeOpen} onClose={() => setIsChangeCodeOpen(false)} />

      {/* Upcoming Birthdays Detail Modal */}
      <UpcomingBirthdaysModal
        isOpen={isBirthdaysModalOpen}
        onClose={() => setIsBirthdaysModalOpen(false)}
        members={familyData.members}
        onSelectMember={(m) => setProfileMember(m)}
        onAddEventForMember={(m) => handleOpenAddEvent(m)}
      />

      {/* Activity Log Modal */}
      <ActivityLogModal
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        activities={activities}
        members={familyData.members}
        onSelectMember={(m) => setProfileMember(m)}
        onClearActivities={() => setActivities([])}
        onResetDefaultActivities={() => setActivities(INITIAL_ACTIVITIES)}
      />

      {/* Invite a relative to fill their own card via WhatsApp */}
      <InviteMemberModal
        isOpen={inviteModal.isOpen}
        onClose={() => setInviteModal({ isOpen: false })}
        familyName={familyData.familyName}
        allMembers={familyData.members}
        presetReferenceId={inviteModal.presetReferenceId}
        presetRelation={inviteModal.presetRelation}
      />

      {/* A filled-in fiche came back via ?fiche=... — preview and one-click import */}
      {incomingSubmission && (
        <ImportSubmittedMemberModal
          submission={incomingSubmission}
          allMembers={familyData.members}
          onDismiss={() => setIncomingSubmission(null)}
          onConfirm={handleImportSubmission}
        />
      )}
    </div>
  );
}
