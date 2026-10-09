import {
  findAllActiveServices,
  findServiceById,
} from "./services.repository";

export async function getServices() {
  return findAllActiveServices();
}

export async function getServiceById(id: string) {
  return findServiceById(id);
}