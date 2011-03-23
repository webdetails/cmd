/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package pt.webdetails.cdf.mobile.favorites;

import java.io.Serializable;
import java.util.Date;

/**
 *
 * @author pedro
 */
public class FavoritesEntry implements Serializable
{

  private int storageId;
  private String user;
  private String storageValue;
  private Date lastUpdatedDate;

  public FavoritesEntry()
  {
    this.lastUpdatedDate = new Date();
  }

  public FavoritesEntry(String user, String storageValue)
  {
    this();
    this.user = user;
    this.storageValue = storageValue;
  }

  /**
   * @return the storageId
   */
  public int getStorageId()
  {
    return storageId;
  }

  /**
   * @param storageId the storageId to set
   */
  public void setStorageId(int storageId)
  {
    this.storageId = storageId;
  }


  /**
   * @return the user
   */
  public String getUser()
  {
    return user;
  }

  /**
   * @param user the user to set
   */
  public void setUser(String user)
  {
    this.user = user;
  }

  /**
   * @return the storage
   */
  public String getStorageValue()
  {
    return storageValue;
  }

  /**
   * @param storage the storage to set
   */
  public void setStorageValue(String storageValue)
  {
    this.storageValue = storageValue;
  }

  /**
   * @return the lastUpdateDate
   */
  public Date getLastUpdatedDate()
  {
    return lastUpdatedDate;
  }

  /**
   * @param createdDate the createdDate to set
   */
  public void setLastUpdatedDate(Date lastUpdatedDate)
  {
    this.lastUpdatedDate = lastUpdatedDate;
  }
}
