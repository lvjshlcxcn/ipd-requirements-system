/**
 * 需求评审中心 API 服务
 */
import api from './api'
import type {
  MeetingListParams,
  MeetingListResponse,
  MeetingCreateRequest,
  MeetingUpdateRequest,
  MeetingResponse,
  Attendee,
  AttendeeCreateRequest,
  AttendeeResponse,
  MeetingRequirement,
  MeetingRequirementCreateRequest,
  MeetingRequirementUpdateRequest,
  MeetingRequirementResponse,
  VoteCreateRequest,
  VoteResponse,
  VoteStatisticsResponse,
  MessageResponse,
} from '@/types/review-meeting'

// 基础路径
const BASE_PATH = '/requirement-review-meetings'

/**
 * 评审会议服务
 */
const reviewMeetingService = {
  // ========================================================================
  // 会议管理
  // ========================================================================

  /**
   * 获取会议列表
   */
  getMeetings: async (params: MeetingListParams = {}): Promise<MeetingListResponse> => {
    const { page = 1, page_size = 20, status, date_filter } = params
    const queryParams = new URLSearchParams({
      page: String(page),
      page_size: String(page_size),
    })
    if (status) queryParams.append('status', status)
    if (date_filter) queryParams.append('date_filter', date_filter)

    const response = await api.get(`${BASE_PATH}/?${queryParams.toString()}`)
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response as MeetingListResponse
  },

  /**
   * 创建会议
   */
  createMeeting: async (data: MeetingCreateRequest): Promise<MeetingResponse> => {
    const response = await api.post(BASE_PATH, data)
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  /**
   * 获取会议详情
   */
  getMeeting: async (meetingId: number): Promise<MeetingResponse> => {
    const response = await api.get(`${BASE_PATH}/${meetingId}`)
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  /**
   * 更新会议
   */
  updateMeeting: async (
    meetingId: number,
    data: MeetingUpdateRequest
  ): Promise<MeetingResponse> => {
    const response = await api.put(`${BASE_PATH}/${meetingId}`, data)
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  /**
   * 删除会议
   */
  deleteMeeting: async (meetingId: number): Promise<MessageResponse> => {
    const response = await api.delete(`${BASE_PATH}/${meetingId}`)
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  // ========================================================================
  // 会议控制
  // ========================================================================

  /**
   * 开始会议
   */
  startMeeting: async (meetingId: number): Promise<MeetingResponse> => {
    const response = await api.post(`${BASE_PATH}/${meetingId}/start`)
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  /**
   * 结束会议
   */
  endMeeting: async (meetingId: number): Promise<MeetingResponse> => {
    const response = await api.post(`${BASE_PATH}/${meetingId}/end`)
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  // ========================================================================
  // 参会人员管理
  // ========================================================================

  /**
   * 获取参会人员列表
   */
  getAttendees: async (meetingId: number): Promise<Attendee[]> => {
    const response = await api.get(`${BASE_PATH}/${meetingId}/attendees`)
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  /**
   * 添加参会人员
   */
  addAttendee: async (
    meetingId: number,
    data: AttendeeCreateRequest
  ): Promise<AttendeeResponse> => {
    const response = await api.post(`${BASE_PATH}/${meetingId}/attendees`, data)
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  /**
   * 移除参会人员
   */
  removeAttendee: async (
    meetingId: number,
    attendeeId: number
  ): Promise<MessageResponse> => {
    const response = await api.delete(
      `${BASE_PATH}/${meetingId}/attendees/${attendeeId}`
    )
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  // ========================================================================
  // 会议需求管理
  // ========================================================================

  /**
   * 获取会议需求列表
   */
  getMeetingRequirements: async (
    meetingId: number
  ): Promise<MeetingRequirement[]> => {
    const response = await api.get(`${BASE_PATH}/${meetingId}/requirements`)
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  /**
   * 添加需求到会议
   */
  addRequirementToMeeting: async (
    meetingId: number,
    data: MeetingRequirementCreateRequest
  ): Promise<MeetingRequirementResponse> => {
    const response = await api.post(`${BASE_PATH}/${meetingId}/requirements`, data)
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  /**
   * 更新会议需求（评审顺序、备注）
   */
  updateMeetingRequirement: async (
    meetingId: number,
    requirementId: number,
    data: MeetingRequirementUpdateRequest
  ): Promise<MessageResponse> => {
    const response = await api.put(
      `${BASE_PATH}/${meetingId}/requirements/${requirementId}`,
      data
    )
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  /**
   * 从会议移除需求
   */
  removeRequirementFromMeeting: async (
    meetingId: number,
    requirementId: number
  ): Promise<MessageResponse> => {
    const response = await api.delete(
      `${BASE_PATH}/${meetingId}/requirements/${requirementId}`
    )
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  // ========================================================================
  // 投票功能
  // ========================================================================

  /**
   * 投票（支持修改已有投票）
   */
  castVote: async (
    meetingId: number,
    requirementId: number,
    data: VoteCreateRequest
  ): Promise<VoteResponse> => {
    const response = await api.post(
      `${BASE_PATH}/${meetingId}/requirements/${requirementId}/vote`,
      data
    )
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  /**
   * 获取投票统计
   */
  getVoteStatistics: async (
    meetingId: number,
    requirementId: number
  ): Promise<VoteStatisticsResponse> => {
    const response = await api.get(
      `${BASE_PATH}/${meetingId}/requirements/${requirementId}/votes`
    )
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  /**
   * 获取当前用户的投票
   */
  getMyVote: async (
    meetingId: number,
    requirementId: number
  ): Promise<VoteResponse> => {
    const response = await api.get(
      `${BASE_PATH}/${meetingId}/requirements/${requirementId}/my-vote`
    )
    // API 拦截器已经返回了 response.data，所以这里直接返回 response
    return response
  },

  // ========================================================================
  // 投票人员管理
  // ========================================================================

  /**
   * 获取投票人员状态
   */
  getVoterStatus: async (
    meetingId: number,
    requirementId: number
  ): Promise<any> => {
    const response = await api.get(
      `${BASE_PATH}/${meetingId}/requirements/${requirementId}/voters`
    )
    return response
  },

  /**
   * 获取当前应该投票的人
   */
  getCurrentVoter: async (
    meetingId: number,
    requirementId: number
  ): Promise<any> => {
    const response = await api.get(
      `${BASE_PATH}/${meetingId}/requirements/${requirementId}/current-voter`
    )
    return response
  },

  /**
   * 切换到下一个投票人（主持人操作）
   */
  moveToNextVoter: async (
    meetingId: number,
    requirementId: number
  ): Promise<any> => {
    const response = await api.post(
      `${BASE_PATH}/${meetingId}/requirements/${requirementId}/next-voter`
    )
    return response
  },

  /**
   * 获取投票会话状态
   */
  getVotingSession: async (
    meetingId: number,
    requirementId: number
  ): Promise<any> => {
    const response = await api.get(
      `${BASE_PATH}/${meetingId}/requirements/${requirementId}/voting-session`
    )
    return response
  },

  /**
   * 更新指定的投票人员列表
   */
  updateAssignedVoters: async (
    meetingId: number,
    requirementId: number,
    data: { assigned_voter_ids: number[] }
  ): Promise<any> => {
    const response = await api.patch(
      `${BASE_PATH}/${meetingId}/requirements/${requirementId}/voters`,
      data
    )
    return response
  },

  // ========================================================================
  // 投票结果存档
  // ========================================================================

  /**
   * 获取投票结果列表
   */
  getVoteResults: async (params: {
    page?: number
    page_size?: number
    meeting_id?: number
  } = {}): Promise<any> => {
    const { page = 1, page_size = 20, meeting_id } = params
    const queryParams = new URLSearchParams({
      page: String(page),
      page_size: String(page_size),
    })
    if (meeting_id) queryParams.append('meeting_id', String(meeting_id))

    const response = await api.get(`${BASE_PATH}/archive/vote-results?${queryParams.toString()}`)
    return response
  },

  /**
   * 获取单个投票结果详情
   */
  getVoteResult: async (resultId: number): Promise<any> => {
    const response = await api.get(`${BASE_PATH}/archive/vote-results/${resultId}`)
    return response
  },

  /**
   * 获取会议的投票结果
   */
  getMeetingVoteResults: async (meetingId: number): Promise<any> => {
    const response = await api.get(`${BASE_PATH}/${meetingId}/archive/vote-results`)
    return response
  },
}

export default reviewMeetingService
