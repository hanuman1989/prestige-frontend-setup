import axiosInstance from '../axios';


export async function contactInquiry(payload) {
  try {
      const response = await axiosInstance.post(`contact-inquiries`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Unable to submit contact inquiry. Please try again.' };
    }
}

const contactInquiryAPI = {
  contactInquiry
};

export default contactInquiryAPI;
