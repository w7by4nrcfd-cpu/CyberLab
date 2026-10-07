import { sqliteTable, text, integer, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const progress = sqliteTable('progress', {
    userId: text('user_id').notNull(), itemId: text('item_id').notNull(), kind: text('kind').notNull(),
    score: integer('score').notNull(), xp: integer('xp').notNull(), completedAt: text('completed_at').notNull()
}, t => [primaryKey({ columns: [t.userId, t.itemId] })]);
export const activity = sqliteTable('activity', {userId:text('user_id').notNull(), lessonId:text('lesson_id').notNull(), startedAt:text('started_at').notNull(), lastAt:text('last_at').notNull(), seconds:integer('seconds').notNull().default(0), completedAt:text('completed_at')}, t=>[primaryKey({columns:[t.userId,t.lessonId]})]);
export const notes = sqliteTable('notes', {userId:text('user_id').notNull(), lessonId:text('lesson_id').notNull(), content:text('content').notNull(), updatedAt:text('updated_at').notNull()}, t=>[primaryKey({columns:[t.userId,t.lessonId]})]);
export const bookmarks = sqliteTable('bookmarks', {userId:text('user_id').notNull(), lessonId:text('lesson_id').notNull(), createdAt:text('created_at').notNull()}, t=>[primaryKey({columns:[t.userId,t.lessonId]})]);
export const attempts = sqliteTable('attempts', {id:integer('id').primaryKey({autoIncrement:true}), userId:text('user_id').notNull(), lessonId:text('lesson_id').notNull(), score:integer('score').notNull(), total:integer('total').notNull(), answers:text('answers').notNull(), createdAt:text('created_at').notNull()},t=>[index('idx_attempts_user_date').on(t.userId,t.createdAt)]);
export const preferences = sqliteTable('preferences', {userId:text('user_id').primaryKey(), dailyGoal:integer('daily_goal').notNull().default(15), theme:text('theme').notNull().default('dark'), updatedAt:text('updated_at').notNull()});
export const dailyTime = sqliteTable('daily_time', {userId:text('user_id').notNull(), day:text('day').notNull(), seconds:integer('seconds').notNull().default(0)}, t=>[primaryKey({columns:[t.userId,t.day]})]);
export const missionProgress = sqliteTable('mission_progress', {
    userId: text('user_id').notNull(), missionId: text('mission_id').notNull(),
    startedAt: text('started_at').notNull(), updatedAt: text('updated_at').notNull(), completedAt: text('completed_at'),
    score: integer('score').notNull().default(0), stars: integer('stars').notNull().default(0),
    hintsUsed: integer('hints_used').notNull().default(0), attempts: integer('attempts').notNull().default(0),
    sessionJson: text('session_json').notNull().default('{}')
}, t => [primaryKey({columns:[t.userId,t.missionId]})]);
export const skillAwards = sqliteTable('skill_awards', {
    userId:text('user_id').notNull(),sourceKind:text('source_kind').notNull(),sourceId:text('source_id').notNull(),
    skillId:text('skill_id').notNull(),xp:integer('xp').notNull(),createdAt:text('created_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.sourceKind,t.sourceId,t.skillId]}),index('idx_skill_awards_user_skill').on(t.userId,t.skillId)]);
export const skillProgress = sqliteTable('skill_progress', {
    userId:text('user_id').notNull(),skillId:text('skill_id').notNull(),
    xp:integer('xp').notNull().default(0),level:integer('level').notNull().default(1),
    progress:integer('progress').notNull().default(0),updatedAt:text('updated_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.skillId]})]);
// Campaign flags capture narrative acknowledgements. Mission completion remains
// the source of truth for chapters, unlocks, events and collected evidence.
export const campaignFlags = sqliteTable('campaign_flags', {
    userId:text('user_id').notNull(),campaignId:text('campaign_id').notNull(),
    flagId:text('flag_id').notNull(),createdAt:text('created_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.campaignId,t.flagId]})]);
export const socInvestigations=sqliteTable('soc_investigations',{
 userId:text('user_id').notNull(),alertId:text('alert_id').notNull(),status:text('status').notNull().default('New'),
 startedAt:text('started_at').notNull(),updatedAt:text('updated_at').notNull(),closedAt:text('closed_at'),
 score:integer('score').notNull().default(0),bestScore:integer('best_score').notNull().default(0),attempts:integer('attempts').notNull().default(0),
 sessionJson:text('session_json').notNull().default('{}')
},t=>[primaryKey({columns:[t.userId,t.alertId]})]);
export const socNotes=sqliteTable('soc_notes',{
 id:integer('id').primaryKey({autoIncrement:true}),userId:text('user_id').notNull(),scopeKind:text('scope_kind').notNull(),scopeId:text('scope_id').notNull(),content:text('content').notNull(),createdAt:text('created_at').notNull()
},t=>[index('idx_soc_notes_scope').on(t.userId,t.scopeKind,t.scopeId)]);
export const socCases=sqliteTable('soc_cases',{
 userId:text('user_id').notNull(),caseId:text('case_id').notNull(),status:text('status').notNull().default('Investigating'),severity:text('severity').notNull(),
 createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),closedAt:text('closed_at'),finalConclusion:text('final_conclusion')
},t=>[primaryKey({columns:[t.userId,t.caseId]})]);
export const socCaseAlerts=sqliteTable('soc_case_alerts',{
 userId:text('user_id').notNull(),caseId:text('case_id').notNull(),alertId:text('alert_id').notNull(),linkedAt:text('linked_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.caseId,t.alertId]})]);
export const socCaseEvidence=sqliteTable('soc_case_evidence',{
 userId:text('user_id').notNull(),caseId:text('case_id').notNull(),alertId:text('alert_id').notNull(),evidenceId:text('evidence_id').notNull(),collectedAt:text('collected_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.caseId,t.alertId,t.evidenceId]})]);
export const interactiveLabProgress=sqliteTable('interactive_lab_progress',{
 userId:text('user_id').notNull(),labId:text('lab_id').notNull(),startedAt:text('started_at').notNull(),updatedAt:text('updated_at').notNull(),completedAt:text('completed_at'),
 bestScore:integer('best_score').notNull().default(0),attempts:integer('attempts').notNull().default(0),hintsUsed:integer('hints_used').notNull().default(0),sessionJson:text('session_json').notNull().default('{}')
},t=>[primaryKey({columns:[t.userId,t.labId]})]);
// A durable, one-time achievement ledger. Readiness is recalculated from the
// existing learning tables; no parallel completion or mastery snapshot lives here.
export const careerPromotions=sqliteTable('career_promotions',{
 userId:text('user_id').notNull(),trackId:text('track_id').notNull(),stageId:text('stage_id').notNull(),
 achievedAt:text('achieved_at').notNull(),requirementsJson:text('requirements_json').notNull()
},t=>[primaryKey({columns:[t.userId,t.trackId,t.stageId]})]);
// The investigation workspace is independent from legacy mission/SOC/campaign rewards.
// Definitions and raw evidence remain in source; these tables hold user annotations only.
export const investigationWorkspaces=sqliteTable('investigation_workspaces',{
 userId:text('user_id').notNull(),investigationId:text('investigation_id').notNull(),status:text('status').notNull().default('open'),
 decisionJson:text('decision_json'),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),closedAt:text('closed_at')
},t=>[primaryKey({columns:[t.userId,t.investigationId]})]);
export const investigationEvidence=sqliteTable('investigation_evidence',{
 userId:text('user_id').notNull(),investigationId:text('investigation_id').notNull(),evidenceId:text('evidence_id').notNull(),
 reviewedAt:text('reviewed_at'),collectedAt:text('collected_at'),classification:text('classification'),note:text('note').notNull().default('')
},t=>[primaryKey({columns:[t.userId,t.investigationId,t.evidenceId]})]);
export const investigationLinks=sqliteTable('investigation_links',{
 userId:text('user_id').notNull(),investigationId:text('investigation_id').notNull(),fromId:text('from_id').notNull(),
 relation:text('relation').notNull(),toId:text('to_id').notNull(),reason:text('reason').notNull(),createdAt:text('created_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.investigationId,t.fromId,t.relation,t.toId]})]);
// Immutable incident snapshots are separate from each learner's existing board state.
export const dynamicIncidents=sqliteTable('dynamic_incidents',{
 userId:text('user_id').notNull(),instanceId:text('instance_id').notNull(),templateId:text('template_id').notNull(),
 variantNumber:integer('variant_number').notNull(),seed:integer('seed').notNull(),difficulty:text('difficulty').notNull(),
 snapshotJson:text('snapshot_json').notNull(),createdAt:text('created_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.instanceId]}),uniqueIndex('idx_dynamic_user_template_variant').on(t.userId,t.templateId,t.variantNumber)]);
export const dynamicActive=sqliteTable('dynamic_active',{
 userId:text('user_id').notNull(),templateId:text('template_id').notNull(),instanceId:text('instance_id').notNull()
},t=>[primaryKey({columns:[t.userId,t.templateId]})]);
// Earned badges extend the original achievements. No XP, mastery or completion is stored here.
export const achievementUnlocks=sqliteTable('achievement_unlocks',{
 userId:text('user_id').notNull(),achievementId:text('achievement_id').notNull(),tier:integer('tier').notNull(),
 earnedAt:text('earned_at').notNull(),proofJson:text('proof_json').notNull()
},t=>[primaryKey({columns:[t.userId,t.achievementId,t.tier]})]);
