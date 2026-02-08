/**
 * 需求评审中心类型定义
 */

// 会议状态
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// 参会状态
export type AttendanceStatus = 'invited' | 'accepted' | 'declined' | 'attended';

// 投票选项
export type VoteOption = 'approve' | 'reject' | 'abstain';

// 会议设置
export interface MeetingSettings {
  allowVoteChange?: boolean;
  anonymousVoting?: boolean;
  requireVoteComment?: boolean;
  [key: string]: any;
}

// 基础会议信息
export interface Meeting {
  id: number;
  meeting_no: string;
  title: string;
  description?: string;
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  moderator_id: number;
  status: MeetingStatus;
  meeting_settings: MeetingSettings;
  created_by?: number;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

// 参会人员
export interface Attendee {
  id: number;
  meeting_id: number;
  attendee_id: number;
  attendance_status: AttendanceStatus;
  tenant_id: number;
  created_at: string;
  updated_at: string;
  // 关联的用户信息（从后端JOIN获取）
  user?: {
    id: number;
    username: string;
    email?: string;
    full_name?: string;
  };
}

// 会议需求
export interface MeetingRequirement {
  id: number;
  meeting_id: number;
  requirement_id: number;
  review_order: number;
  meeting_notes?: string;
  tenant_id: number;
  created_at: string;
  updated_at: string;
  // 关联的需求信息（从后端JOIN获取）
  requirement?: {
    id: number;
    requirement_no: string;
    title: string;
    target_type?: string; // 需求类型（sp/bp/charter/pcr）
    moscow_priority?: string; // 优先级（must/should/could/wont）
    description?: string;
  };
}

// 投票记录
export interface Vote {
  id: number;
  meeting_id: number;
  requirement_id: number;
  voter_id: number;
  vote_option: VoteOption;
  comment?: string;
  tenant_id: number;
  created_at: string;
  updated_at: string;
  // 关联的用户信息
  voter?: {
    id: number;
    username: string;
    full_name?: string;
    avatar?: string;
  };
}

// 当前投票人信息
export interface CurrentVoter {
  voter_id: number;
  voter_name: string;
  full_name?: string;
  avatar?: string;
  started_at: string;
}

// 投票会话状态
export interface VotingSession {
  meeting_id: number;
  requirement_id: number;
  current_voter_index: number;
  total_voters: number;
  completed_voter_ids: number[];
  current_voter: CurrentVoter | null;
  is_voting_complete: boolean;
  started_at?: string;
  updated_at?: string;
}

// 投票统计
export interface VoteStatistics {
  requirement_id: number;
  total_votes: number;
  approve_count: number;
  approve_percentage: number;
  reject_count: number;
  reject_percentage: number;
  abstain_count: number;
  abstain_percentage: number;
  completion_percentage: number; // 投票完成度 (已完成投票人数 / 总投票人数)
  votes: Array<{
    voter_id: number;
    voter_name: string;
    vote_option: VoteOption;
    comment?: string;
    voted_at: string;
  }>;
}

// 创建会议请求
export interface MeetingCreateRequest {
  title: string;
  description?: string;
  scheduled_at: string;
  moderator_id: number;
  meeting_settings?: MeetingSettings;
}

// 更新会议请求
export interface MeetingUpdateRequest {
  title?: string;
  description?: string;
  scheduled_at?: string;
  status?: MeetingStatus;
  meeting_settings?: MeetingSettings;
}

// 添加参会人员请求
export interface AttendeeCreateRequest {
  attendee_id: number;
  attendance_status?: AttendanceStatus;
}

// 添加需求到会议请求
export interface MeetingRequirementCreateRequest {
  requirement_id: number;
  meeting_notes?: string;
}

// 更新会议需求请求
export interface MeetingRequirementUpdateRequest {
  review_order?: number;
  meeting_notes?: string;
}

// 投票请求
export interface VoteCreateRequest {
  vote_option: VoteOption;
  comment?: string;
}

// API 响应类型
export interface MeetingListResponse {
  success: boolean;
  data: {
    items: Meeting[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface MeetingResponse {
  success: boolean;
  message?: string;
  data: Meeting;
}

export interface AttendeeResponse {
  success: boolean;
  message?: string;
  data: Attendee;
}

export interface MeetingRequirementResponse {
  success: boolean;
  message?: string;
  data: MeetingRequirement;
}

export interface VoteResponse {
  success: boolean;
  message?: string;
  data: Vote;
}

export interface VoteStatisticsResponse {
  success: boolean;
  data: VoteStatistics;
}

export interface VoterStatusResponse {
  success: boolean;
  data: {
    meeting_id: number;
    requirement_id: number;
    current_voter_id: number | null;
    current_voter: CurrentVoter | null;
    is_voting_complete: boolean;
    total_voters: number;
    completed_voter_ids: number[];
  };
}

export interface VotingSessionResponse {
  success: boolean;
  data: VotingSession;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

// 列表查询参数
export interface MeetingListParams {
  page?: number;
  page_size?: number;
  status?: MeetingStatus;
  date_filter?: string;
}
